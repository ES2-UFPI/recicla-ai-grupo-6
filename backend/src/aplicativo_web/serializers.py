# backend/src/aplicativo_web/serializers.py
from rest_framework import serializers
import re
from .models import Produtor, Coletor, Cooperativa, SolicitacaoColeta, ItemColeta

# --- Serializers de Registro (Atualizados para novos campos) ---


class ProdutorRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produtor
        # ATUALIZADO: 'cpf_cnpj' e novos campos
        fields = [
            'id', 'nome', 'email', 'senha', 'telefone', 'cpf_cnpj',
            'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado', 'geom',
            'nota_avaliacao_atual', 'total_avaliacoes', 'saldo_pontos'
        ]
        # ATUALIZADO: 'id' e campos novos são read_only
        extra_kwargs = {
            'senha': {'write_only': True},
            'id': {'read_only': True},
            'nota_avaliacao_atual': {'read_only': True},
            'total_avaliacoes': {'read_only': True},
            'saldo_pontos': {'read_only': True},
        }

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError({'detail': str(e)})

    def validate_cep(self, value):
        """Remove caracteres não numéricos do CEP antes de salvar."""
        if value is None:
            return value
        return re.sub(r"\D", "", str(value))


class ColetorRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coletor
        # ATUALIZADO: 'cpf' e novos campos
        fields = [
            'id', 'nome', 'email', 'senha', 'telefone', 'cpf',
            'cep', 'cidade', 'estado', 'geom',
            'nota_avaliacao_atual', 'total_avaliacoes'
        ]
        extra_kwargs = {
            'senha': {'write_only': True},
            'id': {'read_only': True},
            'nota_avaliacao_atual': {'read_only': True},
            'total_avaliacoes': {'read_only': True},
        }

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError({'detail': str(e)})

    def validate_cep(self, value):
        """Remove caracteres não numéricos do CEP antes de salvar."""
        if value is None:
            return value
        return re.sub(r"\D", "", str(value))


class CooperativaRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cooperativa
        # ATUALIZADO: 'id' é read_only
        fields = [
            'id', 'nome_empresa', 'email', 'senha', 'telefone', 'cnpj',
            'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado', 'geom'
        ]
        extra_kwargs = {'senha': {'write_only': True},
                        'id': {'read_only': True}}

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError({'detail': str(e)})

    def validate_cep(self, value):
        """Remove caracteres não numéricos do CEP antes de salvar."""
        if value is None:
            return value
        return re.sub(r"\D", "", str(value))

# --- Serializer de Login (Sem alterações, mas ajustado para 'cpf_cnpj') ---


class LoginSerializer(serializers.Serializer):
    # O frontend envia 'email', que pode ser email OU cpf/cnpj
    email = serializers.CharField(required=True)
    password = serializers.CharField(required=True)

# --- Serializer para Itens (Atualizado) ---


class ItemColetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemColeta
        # ATUALIZADO: Campos corretos para criação
        fields = ['tipo_residuo', 'quantidade', 'unidade_medida']

# --- Serializer para CRIAR Solicitação (Atualizado) ---


class SolicitacaoColetaCreateSerializer(serializers.ModelSerializer):
    itens = ItemColetaSerializer(many=True)

    class Meta:
        model = SolicitacaoColeta

        fields = [
            'inicio_coleta',
            'fim_coleta',
            'observacoes',
            'itens'
        ]
        extra_kwargs = {
            'observacoes': {'required': False, 'allow_null': True, 'allow_blank': True}
        }

    def create(self, validated_data):
        try:
            itens_data = validated_data.pop('itens')
            solicitacao = SolicitacaoColeta.objects.create(**validated_data)
            for item_data in itens_data:
                ItemColeta.objects.create(solicitacao=solicitacao, **item_data)
            return solicitacao
        except Exception as e:
            raise serializers.ValidationError(
                {'detail': f'Erro ao criar solicitação: {str(e)}'})

# --- Serializer para LISTAR Solicitações (Atualizado) ---


class SolicitacaoColetaListSerializer(serializers.ModelSerializer):
    coletor_nome = serializers.CharField(
        source='coletor.nome', read_only=True, allow_null=True)
    itens_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)

    # Nested com dados resumidos do produtor (inclui endereço)
    class ProdutorResumoSerializer(serializers.ModelSerializer):
        class Meta:
            model = Produtor
            fields = ['id', 'nome', 'email', 'telefone', 'cep',
                      'rua', 'numero', 'bairro', 'cidade', 'estado']
            read_only_fields = fields

    produtor = ProdutorResumoSerializer(read_only=True)

    class Meta:
        model = SolicitacaoColeta

        fields = [
            'id', 'inicio_coleta', 'fim_coleta', 'status',
            'status_display', 'coletor_nome', 'itens_count', 'observacoes',
            'produtor'
        ]
        read_only_fields = fields

    def get_itens_count(self, obj):
        return obj.itens.count()


class SolicitacaoColetaDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado de uma solicitação, incluindo os itens (itens de coleta)."""
    coletor_nome = serializers.CharField(
        source='coletor.nome', read_only=True, allow_null=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)
    produtor = SolicitacaoColetaListSerializer.ProdutorResumoSerializer(
        read_only=True)
    itens = ItemColetaSerializer(many=True, read_only=True)

    class Meta:
        model = SolicitacaoColeta
        fields = [
            'id', 'inicio_coleta', 'fim_coleta', 'status', 'status_display',
            'coletor_nome', 'produtor', 'observacoes', 'itens'
        ]
        read_only_fields = fields
