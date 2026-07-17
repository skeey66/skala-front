// 도시 선택 콤보박스로 실시간 날씨를 표시하는 스크립트 (weatherAPI.js 모듈 미사용 버전).
const citySelect = document.querySelector('#city-select');
const weatherBox = document.querySelector('#weather-box');

// 진행 중인 요청을 기억해두고, 도시를 빠르게 바꾸면 이전 요청을 취소한다.
// (취소하지 않으면 먼저 고른 도시의 응답이 뒤늦게 도착해 화면을 덮어쓰는 경쟁 상태가 생긴다.)
let currentWeatherRequest = null;

// WMO 날씨 코드(Open-Meteo current.weather_code)를 한글 설명 + 이모지로 바꿔주는 변환표.
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
        71: { emoji: '🌨️', text: '약한 눈' },
        73: { emoji: '🌨️', text: '눈' },
        75: { emoji: '❄️', text: '강한 눈' },
        80: { emoji: '🌦️', text: '약한 소나기' },
        81: { emoji: '🌦️', text: '소나기' },
        82: { emoji: '⛈️', text: '강한 소나기' },
        95: { emoji: '⛈️', text: '뇌우' },
    };
    return table[code] || { emoji: '🌡️', text: '정보 없음' };
}

citySelect.addEventListener('change', async function(event) {
    // 이전 요청이 아직 진행 중이면 취소하고 새로 시작한다.
    if (currentWeatherRequest) {
        currentWeatherRequest.abort();
    }

    const selectedValue = event.target.value;

    if (selectedValue === "none") {
        weatherBox.innerHTML = "<p>도시를 선택하면 좌표가 표시됩니다.</p>";
        return;
    }

    const coords = selectedValue.split(',');
    const lat = coords[0];
    const lon = coords[1];
    const cityName = citySelect.options[citySelect.selectedIndex].text;

    // 데이터를 가져오는 동안 로딩 표시를 띄운다.
    weatherBox.innerHTML = "<p>실시간 날씨 로딩 중... ⏳</p>";

    // AbortController로 재선택 취소와 응답 지연 타임아웃을 함께 처리한다.
    const controller = new AbortController();
    currentWeatherRequest = controller;
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8초 초과 시 포기

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;
        const response = await fetch(url, { signal: controller.signal });

        // HTTP 상태 코드를 확인해 200번대가 아니면 에러로 처리한다.
        if (!response.ok) {
            throw new Error('서버 응답 불안정 (status ' + response.status + ')');
        }

        const data = await response.json();

        // 응답에서 필요한 값을 꺼낸다.
        const currentTemp = data.current.temperature_2m;
        const currentHumidity = data.current.relative_humidity_2m;
        const feelsLike = data.current.apparent_temperature;
        const windSpeed = data.current.wind_speed_10m;
        const weatherInfo = describeWeatherCode(data.current.weather_code);

        // 이 요청이 여전히 가장 최근 요청일 때만 화면을 갱신한다.
        if (currentWeatherRequest !== controller) return;

        weatherBox.innerHTML =
            `<p><b>🌍 ${cityName}</b></p>
            <p>${weatherInfo.emoji} ${weatherInfo.text}</p>
            <p>🌡️ 현재 기온: <b>${currentTemp}°C</b> (체감 ${feelsLike}°C)</p>
            <p>💧 현재 습도: <b>${currentHumidity}%</b></p>
            <p>🍃 풍속: <b>${windSpeed}m/s</b></p>`;

    } catch (error) {
        if (error.name === 'AbortError') {
            // 재선택이나 타임아웃으로 취소된 요청이므로 조용히 무시한다.
            return;
        }
        if (currentWeatherRequest === controller) {
            weatherBox.innerHTML = "<p>⚠️ 날씨 정보를 가져오는데 실패했습니다. 잠시 후 다시 시도해 주세요.</p>";
        }
        console.error(error);
    } finally {
        clearTimeout(timeoutId);
    }
});
