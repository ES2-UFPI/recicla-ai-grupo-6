from django.test import TestCase


class CooperativaNotificationTest(TestCase):
    """Teste TDD: quando uma nova cooperativa se cadastrar, uma notificação
    (push / popup no navegador) deve ser disparada para coletores ativos/logados.
    """

    def test_notification_sent_to_active_collectors_on_cooperativa_create(self):
        # TODO: implementar cenário de criação de cooperativa e verificação
        # de que notificações foram enviadas aos coletores ativos.
        # Por enquanto: marcar como não-implementado para que o teste falhe
        # obedecendo a prática TDD inicial.
        self.fail('Not implemented: push notification dispatch for new cooperativa')
