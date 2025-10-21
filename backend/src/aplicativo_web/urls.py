# backend/src/aplicativo_web/urls.py
from django.urls import path
from . import views
from .views import (
    ProdutorRegisterView, 
    ColetorRegisterView, 
    CooperativaRegisterView,
    CustomLoginView,
    SolicitarColetaView,
    MinhasSolicitacoesView
)

urlpatterns = [
    path("", views.index, name="index"),
    path('register/producer/', ProdutorRegisterView.as_view(), name='register-producer'),
    path('register/collector/', ColetorRegisterView.as_view(), name='register-collector'),
    path('register/cooperative/', CooperativaRegisterView.as_view(), name='register-cooperative'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('coletas/solicitar/', SolicitarColetaView.as_view(), name='solicitar-coleta'),
    path('coletas/minhas/', MinhasSolicitacoesView.as_view(), name='minhas-solicitacoes'),
]