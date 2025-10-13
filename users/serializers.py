# users/serializers.py
from rest_framework import serializers
from .models import Produtor, Coletor, Cooperativa

#SERIALIZERS DE CADASTRO
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

#SERIALIZER PARA O LOGIN
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)