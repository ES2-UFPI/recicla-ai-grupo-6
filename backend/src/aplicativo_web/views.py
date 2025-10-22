# backend/src/aplicativo_web/views.py

from django.http import FileResponse, Http404, HttpResponse
from django.conf import settings
from django.shortcuts import render
from pathlib import Path
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import permissions
from rest_framework import serializers

# Importações de Serializers e Models
from .serializers import (
    ProdutorRegistrationSerializer,
    ColetorRegistrationSerializer,
    CooperativaRegistrationSerializer,
    LoginSerializer,
    SolicitacaoColetaCreateSerializer,
    SolicitacaoColetaListSerializer
)
from .models import Produtor, Coletor, Cooperativa, SolicitacaoColeta

# Importação da Permissão Customizada
from .permissions import IsProdutor

# --- Views Originais (Servir Frontend e Teste) ---


def spa(request):
    """
    Serve o arquivo index.html do build do frontend React.
    Qualquer rota que não seja '/api/' cairá aqui.
    """
    index = Path(settings.BASE_DIR.parent.parent,
                 "frontend", "build", "index.html")
    if not index.exists():
        raise Http404(
            "Frontend build not found. Run `npm run build` in /frontend.")
    return FileResponse(open(index, "rb"))


def index(request):
    """
    View de teste simples para a rota '/api/'.
    """
    return HttpResponse("Olá, mundo. Você está no índice da API.")

# --- Views de Cadastro ---


class ProdutorRegisterView(generics.CreateAPIView):
    """
    Endpoint para cadastrar um novo Produtor.
    """
    serializer_class = ProdutorRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ColetorRegisterView(generics.CreateAPIView):
    """
    Endpoint para cadastrar um novo Coletor.
    """
    serializer_class = ColetorRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CooperativaRegisterView(generics.CreateAPIView):
    """
    Endpoint para cadastrar uma nova Cooperativa.
    """
    serializer_class = CooperativaRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- View de Login Customizada ---


class CustomLoginView(APIView):
    """
    Endpoint customizado para login.
    Verifica email e senha (texto puro) nas tabelas Produtor, Coletor e Cooperativa.
    Retorna tokens JWT em caso de sucesso, incluindo user_id e user_type no payload.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')
        user = None
        user_type = None

        # 1) try by email
        if Produtor.objects.filter(email=identifier).exists():
            user = Produtor.objects.get(email=identifier)
            user_type = 'produtor'
        elif Coletor.objects.filter(email=identifier).exists():
            user = Coletor.objects.get(email=identifier)
            user_type = 'coletor'
        elif Cooperativa.objects.filter(email=identifier).exists():
            user = Cooperativa.objects.get(email=identifier)
            user_type = 'cooperativa'
        else:
            # 2) try by document per model:
            # Produtor -> cpf (model field `cpf`)
            # Coletor  -> cpf (model field `cpf` maps to db_column 'cpf_cnpj')
            # Cooperativa -> cnpj
            if Produtor.objects.filter(cpf=identifier).exists():
                user = Produtor.objects.get(cpf=identifier)
                user_type = 'produtor'
            elif Coletor.objects.filter(cpf=identifier).exists():
                # Coletor.cpf is mapped to db column 'cpf_cnpj' via models.py
                user = Coletor.objects.get(cpf=identifier)
                user_type = 'coletor'
            elif Cooperativa.objects.filter(cnpj=identifier).exists():
                user = Cooperativa.objects.get(cnpj=identifier)
                user_type = 'cooperativa'

        if user and user.senha == password:
            refresh = RefreshToken()
            refresh['user_id'] = user.pk
            refresh['user_type'] = user_type

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_type': user_type
            }, status=status.HTTP_200_OK)

        return Response(
            {'detail': 'Nenhuma conta ativa encontrada com as credenciais fornecidas.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

# --- View para Criar Solicitação de Coleta ---


class SolicitarColetaView(generics.CreateAPIView):
    """
    Endpoint para Produtores criarem uma nova Solicitação de Coleta.
    """
    serializer_class = SolicitacaoColetaCreateSerializer
    permission_classes = [IsProdutor]

    def perform_create(self, serializer):
        """
        Associa automaticamente a nova solicitação ao Produtor autenticado.
        Pega o user_id do payload anexado pela permissão customizada.
        """
        try:
            auth_payload = getattr(self.request, 'auth_payload', None)
            if not auth_payload or 'user_id' not in auth_payload:
                raise AttributeError

            user_id = auth_payload.get('user_id')
            produtor_profile = Produtor.objects.get(pk=user_id)
            serializer.save(produtor=produtor_profile)
        except Produtor.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "Perfil de Produtor não encontrado para este usuário."})
        except AttributeError:
            raise serializers.ValidationError(
                {"detail": "Informação do usuário (user_id) não encontrada na autenticação."})
        except Exception as e:
            raise serializers.ValidationError(
                {"detail": f"Erro inesperado ao associar produtor: {e}"})

# --- View para Listar Minhas Solicitações ---


class MinhasSolicitacoesView(generics.ListAPIView):
    """
    Endpoint para Produtores listarem suas próprias Solicitações de Coleta.
    """
    serializer_class = SolicitacaoColetaListSerializer
    permission_classes = [IsProdutor]

    def get_queryset(self):
        """
        Filtra as solicitações para retornar apenas aquelas
        pertencentes ao Produtor autenticado.
        """
        try:
            auth_payload = getattr(self.request, 'auth_payload', None)
            if not auth_payload or 'user_id' not in auth_payload:
                return SolicitacaoColeta.objects.none()

            user_id = auth_payload.get('user_id')
            produtor_profile = Produtor.objects.get(pk=user_id)
            return SolicitacaoColeta.objects.filter(produtor=produtor_profile).order_by('-id')
        except Produtor.DoesNotExist:
            return SolicitacaoColeta.objects.none()
        except AttributeError:
            return SolicitacaoColeta.objects.none()
        except Exception as e:
            print(f"Erro ao buscar solicitações: {e}")
            return SolicitacaoColeta.objects.none()


def escolha_cooperativa_view(request):
    queryset = Cooperativa.objects.all()
    context = {
        "object_list": queryset
    }
    return render(request, "aplicativo_web/cooperativa_list.html", context)
