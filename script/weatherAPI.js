// Open-Meteo API로 실시간 날씨를 가져오는 모듈.
// - 같은 좌표는 10분간 캐시해 중복 요청을 줄인다.
// - 요청이 너무 오래 걸리면 타임아웃 처리하고, 일시적 오류는 한 번 더 재시도한다.
// - AbortSignal을 넘기면 진행 중인 이전 요청을 취소할 수 있다.
// - 기온/체감온도/습도/풍속/강수확률과 날씨 상태(맑음·비·눈 등)를 함께 반환한다.

const WEATHER_CACHE = new Map(); // key: "lat,lon" -> { data, fetchedAt }
const CACHE_TTL_MS = 10 * 60 * 1000; // 10분
const REQUEST_TIMEOUT_MS = 8000;

// WMO 날씨 코드(Open-Meteo current.weather_code)를 한글 설명 + 이모지로 바꿔주는 표.
// 참고: https://open-meteo.com/en/docs
function describeWeatherCode(code) {
    const table = {
        0: { emoji: '☀️', text: '맑음' },
        1: { emoji: '🌤️', text: '대체로 맑음' },
        2: { emoji: '⛅', text: '구름 조금' },
        3: { emoji: '☁️', text: '흐림' },
        45: { emoji: '🌫️', text: '안개' },
        48: { emoji: '🌫️', text: '서리 안개' },
        51: { emoji: '🌦️', text: '약한 이슬비' },
        53: { emoji: '🌦️', text: '이슬비' },
        55: { emoji: '🌦️', text: '강한 이슬비' },
        61: { emoji: '🌧️', text: '약한 비' },
        63: { emoji: '🌧️', text: '비' },
        65: { emoji: '🌧️', text: '강한 비' },
        66: { emoji: '🌧️', text: '어는 비' },
        67: { emoji: '🌧️', text: '강한 어는 비' },
        71: { emoji: '🌨️', text: '약한 눈' },
        73: { emoji: '🌨️', text: '눈' },
        75: { emoji: '❄️', text: '강한 눈' },
        77: { emoji: '❄️', text: '싸락눈' },
        80: { emoji: '🌦️', text: '약한 소나기' },
        81: { emoji: '🌦️', text: '소나기' },
        82: { emoji: '⛈️', text: '강한 소나기' },
        85: { emoji: '🌨️', text: '약한 눈 소나기' },
        86: { emoji: '🌨️', text: '강한 눈 소나기' },
        95: { emoji: '⛈️', text: '뇌우' },
        96: { emoji: '⛈️', text: '우박을 동반한 뇌우' },
        99: { emoji: '⛈️', text: '강한 우박을 동반한 뇌우' },
    };
    return table[code] || { emoji: '🌡️', text: '정보 없음' };
}

// fetch 요청에 타임아웃을 걸어준다. 바깥에서 받은 signal(재선택 취소용)이 먼저
// 끊기면 그것도 그대로 반영해서, "취소"와 "시간초과"를 하나의 AbortError로 통일한다.
async function fetchWithTimeout(url, outerSignal) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

    if (outerSignal) {
        if (outerSignal.aborted) {
            timeoutController.abort();
        } else {
            outerSignal.addEventListener('abort', () => timeoutController.abort());
        }
    }

    try {
        return await fetch(url, { signal: timeoutController.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * @param {number|string} lat 위도
 * @param {number|string} lon 경도
 * @param {{ signal?: AbortSignal, skipCache?: boolean }} [options]
 */
export async function getLiveWeather(lat, lon, options = {}) {
    const { signal, skipCache } = options;
    const cacheKey = lat + ',' + lon;

    if (!skipCache) {
        const cached = WEATHER_CACHE.get(cacheKey);
        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
            return cached.data;
        }
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
        `&hourly=precipitation_probability`;

    // 일시적인 오류는 한 번 더 시도해본다 (최대 2번, 취소/타임아웃은 재시도하지 않음).
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const response = await fetchWithTimeout(url, signal);
            if (!response.ok) throw new Error('서버 응답 불안정 (status ' + response.status + ')');

            const data = await response.json();

            // 강수 확률은 current가 아니라 hourly로만 내려주므로, 지금 시각(UTC)과 가장 가까운 시간대를 찾는다.
            const nowHour = new Date().toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
            const hourIndex = data.hourly.time.findIndex((t) => t.startsWith(nowHour));
            const precip = hourIndex !== -1 ? data.hourly.precipitation_probability[hourIndex] : null;
            const weatherInfo = describeWeatherCode(data.current.weather_code);

            const result = {
                temp: data.current.temperature_2m,
                feelsLike: data.current.apparent_temperature,
                humidity: data.current.relative_humidity_2m,
                windSpeed: data.current.wind_speed_10m,
                precip: precip,
                weatherEmoji: weatherInfo.emoji,
                weatherText: weatherInfo.text,
            };

            WEATHER_CACHE.set(cacheKey, { data: result, fetchedAt: Date.now() });
            return result;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw error; // 취소/타임아웃은 재시도 없이 그대로 위로 던져서 호출한 쪽이 구분할 수 있게 한다.
            }
            console.error('API 모듈 에러 (시도 ' + attempt + '/2):', error);
            if (attempt === 2) {
                return null; // 재시도까지 다 실패
            }
        }
    }

    return null;
}
