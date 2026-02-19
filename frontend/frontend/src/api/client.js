const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

let tokenExpiredCallback = null;

export function setTokenExpiredCallback(callback) {
  tokenExpiredCallback = callback;
}

async function request(path, options = {}) {
  const token = localStorage.getItem('brainloop_token');
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Add Authorization header with token if it exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const fetchOptions = {
    ...options,
    headers,
  };

  const res = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

  if (res.status === 401) {
    // Token expired or invalid - show the modal
    if (tokenExpiredCallback) {
      tokenExpiredCallback();
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const errorMsg = `API ${res.status}: ${text || res.statusText}`;
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function getTopicsByType(type) {
  const path =
    type === 'code'
      ? '/topics/code'
      : type === 'multiple-choice'
      ? '/topics/multiple-choice'
      : null;
  if (!path) return [];
  return request(path);
}

export async function getRandomQuestions(type, topicIds = [], limit = 10) {
  const topicsParam = topicIds.length ? `&topics=${topicIds.join(',')}` : '';
  const path = `/random-questions?type=${encodeURIComponent(type)}${topicsParam}&limit=${limit}`;
  return request(path);
}

export const submitAnswer = async (questionId, answer, userId) => {
  return request('/submit', {
    method: 'POST',
    body: JSON.stringify({
      question_id: questionId,
      answer,
    }),
  });
};

export async function getMe() {
  return request('/auth/me');
}

export async function completeSession(correctAnswers, endTime = null, startTime = null) {
  return request('/complete-session', {
    method: 'POST',
    body: JSON.stringify({
      correct_answers: correctAnswers,
      start_time: startTime || new Date().toISOString(),
      end_time: endTime || new Date().toISOString(),
    }),
  });
}

export { API_BASE_URL };
export { request };
