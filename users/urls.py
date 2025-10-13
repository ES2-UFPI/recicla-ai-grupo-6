# users/urls.py
from django.urls import path
from .views import (
    ProdutorRegisterView, 
    ColetorRegisterView, 
    CooperativaRegisterView,
    CustomLoginView
)

urlpatterns = [
    #ENDPOINTS DE CADASTRO
    path('register/producer/', ProdutorRegisterView.as_view(), name='register-producer'),
    path('register/collector/', ColetorRegisterView.as_view(), name='register-collector'),
    path('register/cooperative/', CooperativaRegisterView.as_view(), name='register-cooperative'),
    
    #ENDPOINT DE LOGIN ATUALIZADO

    path('login/', CustomLoginView.as_view(), name='login'),
]