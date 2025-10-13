# users/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    ProdutorRegistrationSerializer, 
    ColetorRegistrationSerializer, 
    CooperativaRegistrationSerializer,
    LoginSerializer
)
from .models import Produtor, Coletor, Cooperativa

#VIEWS DE CADASTRO
class ProdutorRegisterView(generics.CreateAPIView):
    serializer_class = ProdutorRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class ColetorRegisterView(generics.CreateAPIView):
    serializer_class = ColetorRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class CooperativaRegisterView(generics.CreateAPIView):
    serializer_class = CooperativaRegistrationSerializer
    permission_classes = [permissions.AllowAny]

#VIEW DE LOGIN CUSTOMIZADA
class CustomLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')
        
        user = None
        user_type = None

        # 1. Procura o usuário nas três tabelas
        if Produtor.objects.filter(email=email).exists():
            user = Produtor.objects.filter(email=email).first()
            user_type = 'produtor'
        elif Coletor.objects.filter(email=email).exists():
            user = Coletor.objects.filter(email=email).first()
            user_type = 'coletor'
        elif Cooperativa.objects.filter(email=email).exists():
            user = Cooperativa.objects.filter(email=email).first()
            user_type = 'cooperativa'

        # 2. Se encontrou um usuário, verifica a senha
        if user and user.senha == password:
            # 3. Se a senha estiver correta, gera os tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_type': user_type
            }, status=status.HTTP_200_OK)
            
        # 4. Se não encontrou ou a senha está errada, retorna erro
        return Response(
            {'detail': 'Nenhuma conta ativa encontrada com as credenciais fornecidas.'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )