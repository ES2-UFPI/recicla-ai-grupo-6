from django.db import models

# Create your models here.
# models.py
from django.contrib.gis.db import models
from django.utils import timezone
from django.urls import reverse


class Coletor(models.Model):
    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100)
    email = models.CharField(max_length=100, unique=True)
    senha = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    cpf = models.CharField(max_length=14, unique=True)
    cep = models.CharField(max_length=9, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)
    # PostGIS point in WGS84 (EPSG:4326)
    geom = models.PointField(srid=4326, blank=True, null=True)

    class Meta:
        db_table = "coletor"

    def __str__(self):
        return f"{self.nome} ({self.email})"


class Cooperativa(models.Model):
    id = models.AutoField(primary_key=True)
    nome_empresa = models.CharField(max_length=150)
    email = models.CharField(max_length=100, unique=True)
    senha = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    cnpj = models.CharField(max_length=18, unique=True)
    cep = models.CharField(max_length=9, blank=True, null=True)
    rua = models.CharField(max_length=150, blank=True, null=True)
    numero = models.CharField(max_length=10, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)
    geom = models.PointField(srid=4326, blank=True, null=True)

    class Meta:
        db_table = "cooperativa"

    def __str__(self):
        return self.nome_empresa
    
    def get_absolute_url(self):
        return reverse("products:product-detail", kwargs={"id": self.id})


class Produtor(models.Model):
    id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100)
    email = models.CharField(max_length=100, unique=True)
    senha = models.CharField(max_length=255)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    cpf = models.CharField(max_length=14, unique=True)
    cep = models.CharField(max_length=9, blank=True, null=True)
    rua = models.CharField(max_length=150, blank=True, null=True)
    numero = models.CharField(max_length=10, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)
    geom = models.PointField(srid=4326, blank=True, null=True)

    class Meta:
        db_table = "produtor"

    def __str__(self):
        return f"{self.nome} ({self.email})"


class SolicitacaoColeta(models.Model):
    STATUS_CHOICES = [
        ('SOLICITADA', 'Solicitada'),
        ('ACEITA', 'Aceita'),
        ('CANCELADA', 'Cancelada'),
        ('CONFIRMADA', 'Confirmada'),
        ('COLETADO', 'Coletado'), 
        ('EM ROTA', 'Em Rota'),   
        ('AGUARDANDO COLETOR', 'Aguardando Coletor'), 
    ]

    produtor = models.ForeignKey(Produtor, on_delete=models.CASCADE, related_name="solicitacoes") 
    coletor = models.ForeignKey(Coletor, on_delete=models.SET_NULL, null=True, blank=True, related_name="coletas") 
    
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_inicio_coleta = models.DateField()
    data_fim_coleta = models.DateField()
    horario_inicio = models.TimeField(null=True, blank=True)
    horario_fim = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SOLICITADA')
    

    observacoes = models.TextField(blank=True, null=True)

    def __str__(self):
        nome_produtor = self.produtor.nome if self.produtor else 'Produtor Desconhecido'
        return f"Solicitação #{self.id} por {nome_produtor} - Status: {self.get_status_display()}"


# --- MODELO PARA OS ITENS DA COLETA ---

class ItemColeta(models.Model):
    CATEGORIA_CHOICES = [
        ('PLASTICO', 'Plástico'),
        ('PAPEL', 'Papel'),
        ('VIDRO', 'Vidro'),
        ('METAL', 'Metal'),
        ('ORGANICO', 'Orgânico'),
        ('ELETRONICO', 'Eletrônico'),
        ('OUTRO', 'Outro'),
    ]
    # related_name='itens' permite acessar os itens a partir de uma solicitação (ex: solicitacao.itens.all())
    solicitacao = models.ForeignKey(SolicitacaoColeta, related_name='itens', on_delete=models.CASCADE)
    descricao = models.CharField(max_length=255) 
    categoria = models.CharField(max_length=50, choices=CATEGORIA_CHOICES)

    def __str__(self):
        return f"{self.descricao} ({self.get_categoria_display()}) - Solicitação #{self.solicitacao.id}"
