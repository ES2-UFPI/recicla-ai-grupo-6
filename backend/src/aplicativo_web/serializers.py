# backend/src/aplicativo_web/serializers.py
from rest_framework import serializers
from .models import Produtor, Coletor, Cooperativa, SolicitacaoColeta, ItemColeta


class ProdutorRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produtor
        fields = '__all__'
        extra_kwargs = {'senha': {'write_only': True}}


class ColetorRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coletor
        fields = '__all__'
        extra_kwargs = {'senha': {'write_only': True}}


class CooperativaRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cooperativa
        fields = '__all__'
        extra_kwargs = {'senha': {'write_only': True}}


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)


class ItemColetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemColeta
        # Mapear para os campos existentes no dump
        fields = ['id_item', 'nome_residuo', 'quantidade']


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
            'horario_inicio': {'required': False, 'allow_null': True},
            'horario_fim': {'required': False, 'allow_null': True},
            'observacoes': {'required': False, 'allow_null': True, 'allow_blank': True}
        }

    def create(self, validated_data):
        itens_data = validated_data.pop('itens')
        solicitacao = SolicitacaoColeta.objects.create(**validated_data)
        for item_data in itens_data:
            # Ajustar chaves para o model ItemColeta (nome_residuo, quantidade)
            ItemColeta.objects.create(solicitacao=solicitacao, **item_data)
        return solicitacao


class SolicitacaoColetaListSerializer(serializers.ModelSerializer):
    # Campo para mostrar o nome do coletor, se houver (lido do modelo Coletor relacionado)
    coletor_nome = serializers.CharField(
        source='coletor.nome', read_only=True, allow_null=True)
    # Campo calculado: conta quantos itens a solicitação tem
    itens_count = serializers.SerializerMethodField()
    # Campo para mostrar o texto do status (ex: "Aguardando Coletor")
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)

    class Meta:
        model = SolicitacaoColeta
        fields = [
            'id',
            'inicio_coleta',
            'fim_coleta',
            'status',
            'status_display',
            'coletor_nome',
            'itens_count'
        ]

    # Função que calcula o valor para o campo 'itens_count'
    def get_itens_count(self, obj):
        return obj.itens.count()
