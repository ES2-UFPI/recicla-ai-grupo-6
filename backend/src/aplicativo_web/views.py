# backend/src/aplicativo_web/views.py

from django.http import FileResponse, Http404, HttpResponse
from django.conf import settings
from pathlib import Path
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import permissions
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated

from .serializers import (
    ProdutorRegistrationSerializer, ColetorRegistrationSerializer,
    CooperativaRegistrationSerializer, LoginSerializer,
    SolicitacaoColetaCreateSerializer, SolicitacaoColetaListSerializer,
    SolicitacaoColetaDetailSerializer
)
from .models import Produtor, Coletor, Cooperativa, SolicitacaoColeta
from .permissions import IsProdutor

# --- Views Originais (Servir Frontend e Teste) ---


def spa(request):
    index = Path(settings.BASE_DIR.parent.parent,
                 "frontend", "build", "index.html")
    if not index.exists():
        raise Http404(
            "Frontend build not found. Run `npm run build` in /frontend.")
    return FileResponse(open(index, "rb"))


def index(request):
    return HttpResponse("Olá, mundo. Você está no índice da API.")

# --- Views de Cadastro ---


class ProdutorRegisterView(generics.CreateAPIView):
    serializer_class = ProdutorRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AtualizarStatusColetaView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, pk):
        try:
            coleta = SolicitacaoColeta.objects.get(pk=pk)
        except SolicitacaoColeta.DoesNotExist:
            return Response({"detail": "Coleta não encontrada"}, status=404)

        novo_status = request.data.get("status")

        if novo_status not in ["ACEITA", "CONFIRMADA", "CANCELADA", "SOLICITADA"]:
            return Response({"detail": "Status inválido"}, status=400)

        coleta.status = novo_status
        coleta.save()

        return Response({
            "id": coleta.id,
            "status": coleta.status
        })

    

class ColetorRegisterView(generics.CreateAPIView):
    serializer_class = ColetorRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CooperativaRegisterView(generics.CreateAPIView):
    serializer_class = CooperativaRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CooperativaListView(generics.ListAPIView):
    """Lista cooperativas cadastradas (para uso pelo frontend)."""
    serializer_class = CooperativaRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        try:
            return Cooperativa.objects.all().order_by('id')
        except Exception as e:
            print(f"Erro ao listar cooperativas: {e}")
            return Cooperativa.objects.none()

# --- View de Login Customizada (Atualizada) ---


class CustomLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Renomeado para 'identifier' para refletir que pode ser email ou documento
        identifier = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')
        user = None
        user_type = None

        # 1) Tenta por email
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
            # 2) Tenta por documento (CPF/CNPJ)
            # ATUALIZADO: Produtor agora usa 'cpf_cnpj'
            if Produtor.objects.filter(cpf_cnpj=identifier).exists():
                user = Produtor.objects.get(cpf_cnpj=identifier)
                user_type = 'produtor'
            elif Coletor.objects.filter(cpf=identifier).exists():
                user = Coletor.objects.get(cpf=identifier)
                user_type = 'coletor'
            elif Cooperativa.objects.filter(cnpj=identifier).exists():
                user = Cooperativa.objects.get(cnpj=identifier)
                user_type = 'cooperativa'

        if user and user.senha == password:
            # Determina o nome a ser retornado conforme o tipo de usuário
            if user_type == 'cooperativa':
                display_name = getattr(user, 'nome_empresa', None) or getattr(
                    user, 'nome', None) or getattr(user, 'email', '')
            else:
                display_name = getattr(user, 'nome', None) or getattr(
                    user, 'nome_empresa', None) or getattr(user, 'email', '')

            refresh = RefreshToken()
            refresh['user_id'] = user.pk
            refresh['user_type'] = user_type
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_type': user_type,
                'name': display_name,
            }, status=status.HTTP_200_OK)

        return Response(
            {'detail': 'Nenhuma conta ativa encontrada com as credenciais fornecidas.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

# --- View para Criar Solicitação de Coleta ---


class SolicitarColetaView(generics.CreateAPIView):
    serializer_class = SolicitacaoColetaCreateSerializer
    permission_classes = [IsProdutor]

    def perform_create(self, serializer):
        try:
            auth_payload = getattr(self.request, 'auth_payload', None)
            if not auth_payload or 'user_id' not in auth_payload:
                raise AttributeError
            user_id = auth_payload.get('user_id')
            produtor_profile = Produtor.objects.get(pk=user_id)
            serializer.save(produtor=produtor_profile)
        except Produtor.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "Perfil de Produtor não encontrado."})
        except AttributeError:
            raise serializers.ValidationError(
                {"detail": "Informação de autenticação não encontrada."})
        except Exception as e:
            raise serializers.ValidationError(
                {"detail": f"Erro inesperado: {e}"})

# --- View para Listar Minhas Solicitações ---


class MinhasSolicitacoesView(generics.ListAPIView):
    serializer_class = SolicitacaoColetaListSerializer
    permission_classes = [IsProdutor]

    def get_queryset(self):
        try:
            auth_payload = getattr(self.request, 'auth_payload', None)
            if not auth_payload or 'user_id' not in auth_payload:
                return SolicitacaoColeta.objects.none()

            user_id = auth_payload.get('user_id')
            produtor_profile = Produtor.objects.get(pk=user_id)
            return SolicitacaoColeta.objects.filter(produtor=produtor_profile).order_by('-id')
        except Produtor.DoesNotExist:
            return SolicitacaoColeta.objects.none()


class DisponiveisSolicitacoesView(generics.ListAPIView):
    """Lista todas as solicitações de coleta disponíveis (status = 'SOLICITADA').
    Usado pelo Coletor/Frontend para ver coletas pendentes no sistema.
    """
    serializer_class = SolicitacaoColetaListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        try:
            return SolicitacaoColeta.objects.filter(status='SOLICITADA').order_by('-id')
        except Exception as e:
            print(f"Erro ao buscar coletas disponiveis: {e}")
            return SolicitacaoColeta.objects.none()
        except Exception as e:
            print(f"Erro ao buscar solicitações: {e}")
            return SolicitacaoColeta.objects.none()


class SolicitacaoColetaDetailView(generics.RetrieveAPIView):
    """Retorna detalhes de uma solicitação de coleta, incluindo os itens."""
    queryset = SolicitacaoColeta.objects.all()
    serializer_class = SolicitacaoColetaDetailSerializer
    permission_classes = [permissions.AllowAny]


class MinhasSolicitacoesColetorView(generics.ListAPIView):
    """Lista as solicitações associadas ao coletor autenticado (coletor.coletas).
    Retorna solicitações onde `coletor` == coletor autenticado. Usa o serializer detalhado
    para incluir os itens de coleta no payload, facilitando a exibição no frontend.
    """
    serializer_class = SolicitacaoColetaDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        try:
            auth_payload = getattr(self.request, 'auth_payload', None)
            # tenta extrair token do header se auth_payload não estiver definido
            if not auth_payload:
                auth_header = self.request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    raw_token = auth_header.split(' ')[1]
                    from rest_framework_simplejwt.authentication import JWTAuthentication
                    jwt_auth = JWTAuthentication()
                    try:
                        validated = jwt_auth.get_validated_token(raw_token)
                        auth_payload = getattr(validated, 'payload', None)
                        if auth_payload:
                            self.request.auth_payload = auth_payload
                    except Exception:
                        auth_payload = None

            if not auth_payload or 'user_id' not in auth_payload or auth_payload.get('user_type') != 'coletor':
                return SolicitacaoColeta.objects.none()

            coletor_id = auth_payload.get('user_id')
            coletor_profile = Coletor.objects.filter(pk=coletor_id).first()
            if not coletor_profile:
                return SolicitacaoColeta.objects.none()

            return SolicitacaoColeta.objects.filter(coletor=coletor_profile).order_by('-id')
        except Exception as e:
            print(f"Erro ao buscar coletas do coletor: {e}")
            return SolicitacaoColeta.objects.none()


class AcceptSolicitacaoView(APIView):
    """Permite que um Coletor autenticado aceite uma solicitação de coleta.
    O coletor é recuperado a partir do payload de autenticação (como nas outras views).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk, *args, **kwargs):
        try:
            auth_payload = getattr(request, 'auth_payload', None)
            # Se a autenticação já não foi feita por uma permission (ex: IsProdutor), tentamos extrair o token do header
            if not auth_payload:
                auth_header = request.headers.get('Authorization')
                if auth_header and auth_header.startswith('Bearer '):
                    raw_token = auth_header.split(' ')[1]
                    from rest_framework_simplejwt.authentication import JWTAuthentication
                    jwt_auth = JWTAuthentication()
                    try:
                        validated = jwt_auth.get_validated_token(raw_token)
                        auth_payload = getattr(validated, 'payload', None)
                        # salva para uso posterior
                        if auth_payload:
                            request.auth_payload = auth_payload
                    except Exception:
                        auth_payload = None

            if not auth_payload or 'user_id' not in auth_payload or auth_payload.get('user_type') != 'coletor':
                return Response({'detail': 'Autenticação de coletor necessária.'}, status=status.HTTP_401_UNAUTHORIZED)

            coletor_id = auth_payload.get('user_id')
            try:
                coletor_profile = Coletor.objects.get(pk=coletor_id)
            except Coletor.DoesNotExist:
                return Response({'detail': 'Perfil de Coletor não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

            try:
                solicit = SolicitacaoColeta.objects.get(pk=pk)
            except SolicitacaoColeta.DoesNotExist:
                return Response({'detail': 'Solicitação não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

            # Verifica se a solicitação ainda está disponível
            if solicit.status != 'SOLICITADA':
                return Response({'detail': 'Solicitação não está disponível para aceitação.'}, status=status.HTTP_400_BAD_REQUEST)

            solicit.coletor = coletor_profile
            solicit.status = 'ACEITA'
            solicit.save()

            serializer = SolicitacaoColetaDetailSerializer(solicit)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'detail': f'Erro inesperado: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
