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
    class Status(models.TextChoices):
        SOLICITADA = "SOLICITADA", "Solicitada"
        ACEITA = "ACEITA", "Aceita"
        CANCELADA = "CANCELADA", "Cancelada"
        CONFIRMADA = "CONFIRMADA", "Confirmada"

    id = models.AutoField(primary_key=True)

    produtor = models.ForeignKey(
        Produtor,
        on_delete=models.CASCADE,
        db_column="produtor_id",
        related_name="solicitacoes",
    )
    coletor = models.ForeignKey(
        Coletor,
        on_delete=models.SET_NULL,
        db_column="coletor_id",
        related_name="coletas",
        blank=True,
        null=True,
    )

    # DB has DEFAULT CURRENT_TIMESTAMP; aligning with Django behavior:
    data_criacao = models.DateTimeField(default=timezone.now)
    data_inicio_coleta = models.DateField()
    data_fim_coleta = models.DateField()
    horario_inicio = models.TimeField(blank=True, null=True)
    horario_fim = models.TimeField(blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SOLICITADA,
    )

    class Meta:
        db_table = "solicitacao_coleta"

    def __str__(self):
        return f"Solicitação #{self.id} — {self.get_status_display()}"
