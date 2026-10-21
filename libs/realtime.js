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
        notifyStatus('connected', 'Neon PostgreSQL Conectado');

        if (data && data.feedbacks && Array.isArray(data.feedbacks)) {
          for (const item of data.feedbacks) {
            if (item.id > lastSeenId) {
              lastSeenId = item.id;
            }
            const dedupKey = item.id || (item.cpf + '|' + item.timestamp);
            if (!isDuplicate(dedupKey)) {
              console.log('[Neon Realtime] 📥 Novo voto detectado no banco de dados:', item);
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
      notifyStatus('offline', 'Aguardando servidor Neon...');
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
          console.log(`[Neon Realtime] Sincronizado com o banco Neon. Último ID existente: ${lastSeenId}`);
        }
        notifyStatus('connected', 'Neon PostgreSQL Conectado');
      }
    } catch (err) {
      console.warn('[Neon Realtime] Não foi possível obter estado inicial do banco:', err.message);
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
            if (res.ok) notifyStatus('connected', 'Neon PostgreSQL Conectado');
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

      // Gravar no Neon PostgreSQL através da API
      try {
        console.log('[Neon Realtime] 📤 Enviando avaliação para gravação no banco de dados Neon...', payload);
        const res = await fetch(getApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          console.log('[Neon Realtime] ✅ Salvo com sucesso no Neon PostgreSQL! ID:', data.feedback?.id);
          notifyStatus('connected', 'Voto gravado no Neon Postgres');
          return data;
        } else {
          console.error('[Neon Realtime] ❌ Erro na resposta da API:', res.statusText);
          notifyStatus('error', 'Falha ao salvar no banco');
        }
      } catch (err) {
        console.error('[Neon Realtime] ❌ Erro de rede ao gravar no banco:', err);
        notifyStatus('offline', 'Erro de rede');
      }
    },

    isConnected: function() {
      return isConnected;
    },

    getTotemUrl: function() {
      const loc = window.location;
      const base = loc.protocol + '//' + loc.host;
      let path = loc.pathname.substring(0, loc.pathname.lastIndexOf('/') + 1);
      return `${base}${path}totem_kiosk.html`;
    }
  };

})(window);
