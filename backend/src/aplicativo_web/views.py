# backend/src/aplicativo_web/views.py

# Importações originais do arquivo dos seus colegas
from django.http import FileResponse, Http404, HttpResponse # Corrigido de HTTPResponse
from django.conf import settings
from pathlib import Path

# Importações adicionadas para a sua API
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

# --- Views originais (para servir o frontend e teste) ---

def spa(request):
    """
    Serve o arquivo index.html do build do frontend React.
    Qualquer rota que não seja '/api/' cairá aqui.
    """
    index = Path(settings.BASE_DIR.parent.parent, "frontend", "build", "index.html")
    if not index.exists():
        raise Http404("Frontend build not found. Run `npm run build` in /frontend.")
    return FileResponse(open(index, "rb"))

def index(request):
    """
    View de teste simples para a rota '/api/'.
    """
    return HttpResponse("Olá, mundo. Você está no índice da API.")

# --- Views adicionadas (Sua API de Cadastro e Login) ---

class ProdutorRegisterView(generics.CreateAPIView):
    """
    Endpoint para cadastrar um novo Produtor.
    """
    serializer_class = ProdutorRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class ColetorRegisterView(generics.CreateAPIView):
    """
    Endpoint para cadastrar um novo Coletor.
    """
    serializer_class = ColetorRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class CooperativaRegisterView(generics.CreateAPIView):
    """
    Endpoint para cadastrar uma nova Cooperativa.
    """
    serializer_class = CooperativaRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class CustomLoginView(APIView):
    """
    Endpoint customizado para login.
    Verifica email e senha (texto puro) nas tabelas Produtor, Coletor e Cooperativa.
    Retorna tokens JWT em caso de sucesso.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')
        user = None
        user_type = None

        # Procura o usuário nas três tabelas
        if Produtor.objects.filter(email=email).exists():
            user = Produtor.objects.get(email=email)
            user_type = 'produtor'
        elif Coletor.objects.filter(email=email).exists():
            user = Coletor.objects.get(email=email)
            user_type = 'coletor'
        elif Cooperativa.objects.filter(email=email).exists():
            user = Cooperativa.objects.get(email=email)
            user_type = 'cooperativa'
        
        # Verifica a senha (comparação direta, pois não está criptografada)
        if user and user.senha == password:
            # Gera os tokens JWT manualmente
            # 'user' aqui é a instância de Produtor/Coletor/Cooperativa
            # Precisamos gerar o token associado ao ID único dele
            refresh = RefreshToken()
            refresh['user_id'] = user.pk # Adiciona o ID do usuário ao token
            refresh['user_type'] = user_type # Adiciona o tipo de usuário ao token

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_type': user_type 
            }, status=status.HTTP_200_OK)
            
        # Retorna erro se não encontrar ou a senha estiver errada
        return Response(
            {'detail': 'Nenhuma conta ativa encontrada com as credenciais fornecidas.'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )