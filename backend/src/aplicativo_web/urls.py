# backend/src/aplicativo_web/urls.py
from django.urls import path
from . import views
from .views import (
    ProdutorRegisterView,
    ColetorRegisterView,
    CooperativaRegisterView,
    CustomLoginView,
    # <-- CORREÇÃO: Corrigido typo (era SolicitarColetView)
    SolicitarColetaView,
    MinhasSolicitacoesView,
    DisponiveisSolicitacoesView,
    # escolha_cooperativa_view
)

urlpatterns = [
    path("", views.index, name="index"),
    path('register/producer/', ProdutorRegisterView.as_view(),
         name='register-producer'),
    path('register/collector/', ColetorRegisterView.as_view(),
         name='register-collector'),
    path('register/cooperative/', CooperativaRegisterView.as_view(),
         name='register-cooperative'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('coletas/solicitar/', SolicitarColetaView.as_view(),
         name='solicitar-coleta'),
    path('coletas/minhas/', MinhasSolicitacoesView.as_view(),
         name='minhas-solicitacoes'),
    path('coletas/disponiveis/', DisponiveisSolicitacoesView.as_view(),
         name='coletas-disponiveis'),
    path("coletas/<int:pk>/status/", views.AtualizarStatusColetaView.as_view(),
     name="atualizar-status-coleta"),
    
    # path('list_cooperativas/', views.escolha_cooperativa_view, name='list-cooperativas'),
]
