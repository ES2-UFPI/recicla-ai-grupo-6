from django.db import models

# Create your models here.
# models.py
from django.contrib.gis.db import models
from django.utils import timezone


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

    produtor = models.ForeignKey(
        Produtor, on_delete=models.CASCADE, related_name="solicitacoes", db_column='produtor_id')
    coletor = models.ForeignKey(Coletor, on_delete=models.SET_NULL, null=True,
                                blank=True, related_name="coletas", db_column='coletor_id')

    # O dump SQL tem inicio_coleta e fim_coleta como timestamp
    inicio_coleta = models.DateTimeField()
    fim_coleta = models.DateTimeField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='SOLICITADA')

    observacoes = models.TextField(blank=True, null=True)

    def __str__(self):
        nome_produtor = self.produtor.nome if self.produtor else 'Produtor Desconhecido'
        return f"Solicitação #{self.id} por {nome_produtor} - Status: {self.get_status_display()}"

    class Meta:
        db_table = 'solicitacao_coleta'
        # O dump não tem data_criacao; ordenar por id desc (mais recente primeiro)
        ordering = ['-id']


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
    # O dump usa a tabela `item_solicitacao` com colunas: id_item, id_solicitacao, quantidade, nome_residuo
    id_item = models.AutoField(primary_key=True)
    solicitacao = models.ForeignKey(
        SolicitacaoColeta, related_name='itens', db_column='id_solicitacao', on_delete=models.CASCADE)
    quantidade = models.DecimalField(max_digits=10, decimal_places=2)
    nome_residuo = models.CharField(max_length=50)

    class Meta:
        db_table = 'item_solicitacao'

    def __str__(self):
        return f"{self.nome_residuo} ({self.quantidade}) - Solicitação #{self.solicitacao.id}"
