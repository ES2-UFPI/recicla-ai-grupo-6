# backend/src/aplicativo_web/test_avaliacao.py

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Produtor, Coletor, SolicitacaoColeta, Cooperativa
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from decimal import Decimal

class AvaliacaoProdutorTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # 1. Cria o cenário: Um Produtor e um Coletor
        self.produtor = Produtor.objects.create(
            nome="Produtor Avaliado",
            email="produtor@teste.com",
            senha="123",
            cpf_cnpj="12345678900",
            nota_avaliacao_atual=0.0,
            total_avaliacoes=0
        )

        self.coletor = Coletor.objects.create(
            nome="Coletor Avaliador",
            email="coletor@teste.com",
            senha="123",
            cpf="09876543210"
        )

        # 2. Cria uma Coleta já CONCLUIDA (ou CONFIRMADA) entre eles
        self.coleta = SolicitacaoColeta.objects.create(
            produtor=self.produtor,
            coletor=self.coletor,
            status="CONCLUIDA", # Status que permite avaliação
            inicio_coleta=timezone.now(),
            fim_coleta=timezone.now()
        )
        
        # 3. Gera o Token do Coletor (simulando o login)
        refresh = RefreshToken()
        refresh['user_id'] = self.coletor.pk
        refresh['user_type'] = 'coletor'
        self.token_coletor = str(refresh.access_token)

    def test_avaliar_produtor_sucesso(self):
        """
        Teste: O coletor envia nota 5 e comentário.
        Esperado: Status 200 e nota do produtor atualizada para 5.0.
        """
        url = '/api/avaliar/produtor/'
        
        payload = {
            "coleta_id": self.coleta.id,
            "nota": 5.0,
            "comentario": "Excelente material!"
        }

        # Autentica como coletor
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token_coletor}')

        # Faz a requisição
        response = self.client.post(url, payload, format='json')

        # Verifica se deu certo
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Recarrega o produtor do banco para conferir a nota
        self.produtor.refresh_from_db()
        self.assertEqual(self.produtor.total_avaliacoes, 1)
        self.assertEqual(self.produtor.nota_avaliacao_atual, Decimal('5.00'))

    def test_avaliar_produtor_calculo_media(self):
        """
        Teste: Produtor já tem nota. Nova avaliação deve recalcular a média.
        """
        # Cenário inicial: 1 avaliação nota 5.0
        self.produtor.total_avaliacoes = 1
        self.produtor.nota_avaliacao_atual = 5.0
        self.produtor.save()

        # Nova avaliação: Nota 3.0
        url = '/api/avaliar/produtor/'
        payload = {
            "coleta_id": self.coleta.id,
            "nota": 3.0
        }
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token_coletor}')
        self.client.post(url, payload, format='json')

        # Esperado: (5 + 3) / 2 = 4.0
        self.produtor.refresh_from_db()
        self.assertEqual(self.produtor.total_avaliacoes, 2)
        self.assertEqual(self.produtor.nota_avaliacao_atual, Decimal('4.00'))

class AvaliacaoColetorTest(TestCase):
    """
    Testes para o fluxo: Cooperativa avalia Coletor, com base em uma SolicitacaoColeta.
    Endpoint alvo: POST /api/avaliar/coletor/
    """

    def setUp(self):
        self.client = APIClient()

        # 1. Produtor da coleta (só pra compor a SolicitacaoColeta)
        self.produtor = Produtor.objects.create(
            nome="Produtor da Coleta",
            email="produtor@teste.com",
            senha="123",
            cpf_cnpj="12345678900",
            nota_avaliacao_atual=0.0,
            total_avaliacoes=0,
            saldo_pontos=0.0,
        )

        # 2. Coletor que será avaliado
        self.coletor = Coletor.objects.create(
            nome="Coletor Avaliado",
            email="coletor@teste.com",
            senha="123",
            cpf="09876543210",
            nota_avaliacao_atual=0.0,
            total_avaliacoes=0,
        )

        # 3. Cooperativa que faz a avaliação
        self.cooperativa = Cooperativa.objects.create(
            nome_empresa="Cooperativa Avaliadora",
            email="coop@teste.com",
            senha="123",
            cnpj="11.222.333/0001-99",
        )

        # 4. Coleta CONCLUIDA envolvendo Produtor, Coletor e Cooperativa
        self.coleta = SolicitacaoColeta.objects.create(
            produtor=self.produtor,
            coletor=self.coletor,
            cooperativa=self.cooperativa,
            status="CONCLUIDA",  # status permitido pela validação
            inicio_coleta=timezone.now(),
            fim_coleta=timezone.now(),
        )

        # 5. Token JWT da Cooperativa (simulando login)
        refresh = RefreshToken()
        refresh["user_id"] = self.cooperativa.pk
        refresh["user_type"] = "cooperativa"
        self.token_cooperativa = str(refresh.access_token)

    def test_avaliar_coletor_sucesso(self):
        """
        Cooperativa envia nota 5 e comentário para um Coletor em uma coleta CONCLUIDA.
        Esperado: 200 OK e nota do Coletor = 5.00, total_avaliacoes = 1.
        """
        url = "/api/avaliar/coletor/"

        payload = {
            "coleta_id": self.coleta.id,
            "nota": 5.0,
            "comentario": "Coletor pontual e organizado.",
        }

        # Autentica como cooperativa
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.token_cooperativa}"
        )

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.coletor.refresh_from_db()
        self.assertEqual(self.coletor.total_avaliacoes, 1)
        self.assertEqual(self.coletor.nota_avaliacao_atual, Decimal("5.00"))

    def test_avaliar_coletor_calculo_media(self):
        """
        Se o Coletor já tem notas anteriores, a nova avaliação deve recalcular a média:
        Ex.: 1 avaliação de 5.0 + nova de 3.0 -> média 4.0
        """
        # Estado inicial: 1 avaliação com nota 5.0
        self.coletor.total_avaliacoes = 1
        self.coletor.nota_avaliacao_atual = 5.0
        self.coletor.save()

        url = "/api/avaliar/coletor/"
        payload = {
            "coleta_id": self.coleta.id,
            "nota": 3.0,
        }

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.token_cooperativa}"
        )

        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Esperado: (5 + 3) / 2 = 4.0
        self.coletor.refresh_from_db()
        self.assertEqual(self.coletor.total_avaliacoes, 2)
        self.assertEqual(self.coletor.nota_avaliacao_atual, Decimal("4.00"))