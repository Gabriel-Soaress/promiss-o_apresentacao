/**
 * Promissão - Sistema Integrado de Avaliação de Eventos
 * Reatividade Direta pelo Banco de Dados Neon PostgreSQL (+ fallback local)
 */
(function(window) {
  'use strict';

  let currentRole = 'device';
  let onFeedbackCallback = null;
  let onStatusCallback = null;
  let lastSeenId = 0;
  let isPolling = false;
  let pollInterval = null;
  let isConnected = false;

  // Controle de mensagens já processadas para evitar duplicatas
  const processedIds = new Set();
  function isDuplicate(id) {
    if (!id) return false;
    if (processedIds.has(id)) return true;
    processedIds.add(id);
    setTimeout(() => processedIds.delete(id), 60000);
    return false;
  }

  // Fallback Local: BroadcastChannel (quando na mesma máquina)
  let bc = null;
  try {
    bc = new BroadcastChannel('promissao_eventos_channel');
    bc.onmessage = (e) => {
      if (e.data && !isDuplicate(e.data.id || (e.data.cpf + '|' + e.data.timestamp))) {
        if (typeof onFeedbackCallback === 'function') onFeedbackCallback(e.data);
      }
    };
  } catch (err) {}

  // Fallback Local: localStorage (para abas diferentes no mesmo computador)
  window.addEventListener('storage', (e) => {
    if (e.key === 'promissao_feedback_trigger') {
      try {
        const raw = localStorage.getItem('promissao_last_feedback');
        if (raw) {
          const data = JSON.parse(raw);
          if (!isDuplicate(data.id || (data.cpf + '|' + data.timestamp))) {
            if (typeof onFeedbackCallback === 'function') onFeedbackCallback(data);
          }
        }
      } catch (err) {}
    }
  });

  function getApiUrl() {
    if (window.location.protocol.startsWith('http')) {
      return '/api/feedback';
    }
    // Fallback caso aberto via file://
    return 'http://localhost:3000/api/feedback';
  }

  function notifyStatus(status, details) {
    isConnected = (status === 'connected');
    if (typeof onStatusCallback === 'function') {
      onStatusCallback({ status, connected: isConnected, details });
    }
  }

  // Polling reativo no banco Neon para o Slide
  async function pollDatabase() {
    if (isPolling) return;
    isPolling = true;

    try {
      const url = `${getApiUrl()}?since_id=${lastSeenId}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });

      if (res.ok) {
        const data = await res.json();
        notifyStatus('connected', 'Conexão Ativa');

        if (data && data.feedbacks && Array.isArray(data.feedbacks)) {
          for (const item of data.feedbacks) {
            if (item.id > lastSeenId) {
              lastSeenId = item.id;
            }
            const dedupKey = item.id || (item.cpf + '|' + item.timestamp);
            if (!isDuplicate(dedupKey)) {
              console.log('[Realtime] 📥 Novo voto detectado:', item);
              if (typeof onFeedbackCallback === 'function') {
                onFeedbackCallback(item);
              }
            }
          }
        }
      } else {
        notifyStatus('error', 'Resposta não-OK da API');
      }
    } catch (err) {
      notifyStatus('offline', 'Aguardando conexão...');
    } finally {
      isPolling = false;
    }
  }

  async function initPolling() {
    try {
      // 1. Pegar o último ID atual do banco para não disparar takeover de votos antigos
      const res = await fetch(`${getApiUrl()}?since_id=0`, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.feedbacks && data.feedbacks.length > 0) {
          const maxId = Math.max(...data.feedbacks.map(f => f.id || 0));
          lastSeenId = maxId;
        }
        notifyStatus('connected', 'Conexão Ativa');
      }
    } catch (err) {
      console.warn('[Realtime] Inicialização local:', err.message);
    }

    // 2. Iniciar verificação reativa a cada 1000ms
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(pollDatabase, 1000);
  }

  window.PromissaoRealtime = {
    init: function(config) {
      config = config || {};
      currentRole = config.role || 'device';
      onFeedbackCallback = config.onFeedback || null;
      onStatusCallback = config.onStatus || null;

      if (currentRole === 'slide') {
        initPolling();
      } else {
        // Totem só precisa verificar conectividade inicial
        fetch(`${getApiUrl()}?since_id=0`)
          .then(res => {
            if (res.ok) notifyStatus('connected', 'Conexão Ativa');
            else notifyStatus('error', 'API indisponível');
          })
          .catch(() => notifyStatus('offline', 'Servidor offline'));
      }

      return this;
    },

    sendFeedback: async function(payload) {
      if (!payload) return;
      if (!payload.timestamp) payload.timestamp = new Date().toISOString();

      // Disparar localmente primeiro para resposta instantânea se na mesma máquina
      if (bc) { try { bc.postMessage(payload); } catch(e) {} }
      try {
        localStorage.setItem('promissao_last_feedback', JSON.stringify(payload));
        localStorage.setItem('promissao_feedback_trigger', Date.now().toString());
      } catch(e) {}

      // Gravar através da API
      try {
        console.log('[Realtime] 📤 Enviando avaliação...', payload);
        const res = await fetch(getApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          console.log('[Realtime] ✅ Salvo com sucesso! ID:', data.feedback?.id);
          notifyStatus('connected', 'Conexão Ativa');
          return data;
        } else {
          console.error('[Realtime] ❌ Erro na resposta da API:', res.statusText);
          notifyStatus('error', 'Falha ao salvar');
        }
      } catch (err) {
        console.error('[Realtime] ❌ Erro de rede:', err);
        notifyStatus('offline', 'Erro de rede');
      }
    },

    isConnected: function() {
      return isConnected;
    },

    getTotemUrl: function() {
      const loc = window.location;
      if (!loc.protocol.startsWith('http')) {
        return 'totem_kiosk.html';
      }
      return `${loc.origin}/totem`;
    },

    getMobileUrl: function() {
      const loc = window.location;
      if (!loc.protocol.startsWith('http')) {
        return 'app_cidadao.html';
      }
      return `${loc.origin}/app`;
    }
  };

})(window);
