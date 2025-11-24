import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ColetorInventario from './ColetorInventario';

describe('ColetorInventario - TDD', () => {
  describe('RED Phase - Testes que devem falhar inicialmente', () => {
    
    test('deve renderizar o título da página', () => {
      render(<ColetorInventario />);
      expect(screen.getByText('Meu Inventário Atual')).toBeInTheDocument();
    });

    test('deve exibir o inventário inicial com 4 itens', () => {
      render(<ColetorInventario />);
      const rows = screen.getAllByRole('row');
      // Header + 4 itens + footer total = 6 rows
      expect(rows).toHaveLength(6);
    });

    test('deve exibir o seletor de cooperativas', () => {
      render(<ColetorInventario />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    test('deve mostrar "Cooperativa Recicla Bem" como cooperativa padrão', () => {
      render(<ColetorInventario />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('coop01');
    });

    test('deve calcular valor total corretamente para cooperativa padrão', () => {
      render(<ColetorInventario />);
      // Plástico: 15 * 2.50 = 37.50
      // Papel: 5 * 1.35 = 6.75
      // Metal: 30 * 0.50 = 15.00
      // Vidro: 50 * 0.08 = 4.00
      // Total: 63.25
      expect(screen.getByText(/R\$ 63,25/)).toBeInTheDocument();
    });

    test('deve atualizar valores ao trocar de cooperativa', () => {
      render(<ColetorInventario />);
      const select = screen.getByRole('combobox');
      
      // Troca para Central Verde
      fireEvent.change(select, { target: { value: 'coop02' } });
      
      // Plástico: 15 * 2.80 = 42.00
      // Papel: 5 * 1.20 = 6.00
      // Metal: 30 * 0.55 = 16.50
      // Vidro: 50 * 0.10 = 5.00
      // Total: 69.50
      expect(screen.getByText(/R\$ 69,50/)).toBeInTheDocument();
    });

    test('deve exibir botão de entregar para cada item', () => {
      render(<ColetorInventario />);
      const entregarButtons = screen.getAllByRole('button', { name: /Entregar/i });
      expect(entregarButtons).toHaveLength(4);
    });

    test('deve remover item ao confirmar entrega', () => {
      // Mock do window.confirm
      global.confirm = jest.fn(() => true);
      global.alert = jest.fn();

      render(<ColetorInventario />);
      
      // Pega o primeiro botão de entregar
      const entregarButtons = screen.getAllByRole('button', { name: /Entregar/i });
      fireEvent.click(entregarButtons[0]);

      // Verifica se o confirm foi chamado
      expect(global.confirm).toHaveBeenCalled();
      
      // Verifica se agora só tem 3 botões de entregar
      const remainingButtons = screen.getAllByRole('button', { name: /Entregar/i });
      expect(remainingButtons).toHaveLength(3);
    });

    test('não deve remover item se usuário cancelar', () => {
      // Mock do window.confirm retornando false
      global.confirm = jest.fn(() => false);

      render(<ColetorInventario />);
      
      const entregarButtons = screen.getAllByRole('button', { name: /Entregar/i });
      const initialCount = entregarButtons.length;
      
      fireEvent.click(entregarButtons[0]);

      // Verifica que ainda tem a mesma quantidade
      const afterButtons = screen.getAllByRole('button', { name: /Entregar/i });
      expect(afterButtons).toHaveLength(initialCount);
    });

    test('deve exibir mensagem quando inventário estiver vazio', () => {
      global.confirm = jest.fn(() => true);
      global.alert = jest.fn();

      render(<ColetorInventario />);
      
      // Remove todos os itens
      const entregarButtons = screen.getAllByRole('button', { name: /Entregar/i });
      entregarButtons.forEach(button => fireEvent.click(button));

      // Verifica mensagem de inventário vazio
      expect(screen.getByText(/Seu inventário está vazio/i)).toBeInTheDocument();
    });

    test('deve exibir ícone de caixa vazia quando não houver itens', () => {
      global.confirm = jest.fn(() => true);
      global.alert = jest.fn();

      render(<ColetorInventario />);
      
      // Remove todos os itens
      const entregarButtons = screen.getAllByRole('button', { name: /Entregar/i });
      entregarButtons.forEach(button => fireEvent.click(button));

      // Verifica se o ícone está presente (através do texto alternativo ou classe)
      const emptyCell = screen.getByRole('cell', { name: /Seu inventário está vazio/i });
      expect(emptyCell).toBeInTheDocument();
    });

    test('deve formatar valores monetários corretamente (vírgula para centavos)', () => {
      render(<ColetorInventario />);
      
      // Verifica se há pelo menos um valor formatado com vírgula
      expect(screen.getByText(/R\$ \d+,\d{2}/)).toBeInTheDocument();
    });

    test('deve exibir quantidade e unidade de medida para cada item', () => {
      render(<ColetorInventario />);
      
      expect(screen.getByText(/15 Sacos/)).toBeInTheDocument();
      expect(screen.getByText(/5 Fardos/)).toBeInTheDocument();
      expect(screen.getByText(/30 Unidades \(latas\)/)).toBeInTheDocument();
      expect(screen.getByText(/50 Unidades \(garrafas\)/)).toBeInTheDocument();
    });

    test('deve ter acessibilidade - labels e roles corretos', () => {
      render(<ColetorInventario />);
      
      // Verifica se a tabela tem estrutura semântica
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      
      // Verifica se há cabeçalhos de tabela
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });

    test('deve calcular preço unitário corretamente', () => {
      render(<ColetorInventario />);
      
      // Para Plástico: 15 sacos * R$ 2,50 = R$ 37,50
      expect(screen.getByText(/R\$ 37,50/)).toBeInTheDocument();
    });

    test('deve ter classe CSS específica para botão de entregar', () => {
      render(<ColetorInventario />);
      
      const entregarButtons = screen.getAllByRole('button', { name: /Entregar/i });
      entregarButtons.forEach(button => {
        expect(button).toHaveClass('btn-entregar-item');
      });
    });

  });
});