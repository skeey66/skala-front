// index.html 실시간 날씨 위젯 - weatherAPI.js 모듈로 현재 위치와 선택 도시의 날씨를 표시한다.
import { getLiveWeather } from './weatherAPI.js';

const citySelect = document.querySelector('#city-select');
const weatherBox = document.querySelector('#weather-box');
const localWeatherEl = document.querySelector('#local-weather');

// 현재 위치(광주광역시 광산구) 좌표 - 페이지가 열리면 바로 표시할 기본 날씨.
const LOCAL_LAT = 35.14;
const LOCAL_LON = 126.79;

async function loadLocalWeather() {
    const info = await getLiveWeather(LOCAL_LAT, LOCAL_LON);

    if (info) {
        localWeatherEl.textContent =
            `${info.weatherEmoji} ${info.weatherText} · 🌡️ ${info.temp}°C · ☔ 강수확률 ${info.precip}%`;
    } else {
        localWeatherEl.textContent = "(날씨 정보를 불러오지 못했습니다)";
    }
}

loadLocalWeather();

// 진행 중인 요청을 기억해두고, 도시를 빠르게 바꾸면 이전 요청을 취소한다.
// (취소하지 않으면 먼저 고른 도시의 응답이 뒤늦게 도착해 화면을 덮어쓰는 경쟁 상태가 생긴다.)
let currentWeatherRequest = null;

citySelect.addEventListener('change', async function(event) {
    if (currentWeatherRequest) {
        currentWeatherRequest.abort();
    }

    const selectedValue = event.target.value;
    if (selectedValue === "none") {
        weatherBox.innerHTML = "<p>도시를 선택하세요.</p>";
        return;
    }

    const coords = selectedValue.split(',');
    const cityName = citySelect.options[citySelect.selectedIndex].text;

    weatherBox.innerHTML = "<p>모듈을 통해 실시간 수신 중... 📡</p>";

    const controller = new AbortController();
    currentWeatherRequest = controller;

    // 모듈 함수를 호출해 날씨 결과만 받아온다.
    let weatherInfo;
    try {
        weatherInfo = await getLiveWeather(coords[0], coords[1], { signal: controller.signal });
    } catch (error) {
        if (error.name === 'AbortError') {
            return; // 더 최근에 고른 도시가 있으므로 이 결과는 버린다.
        }
        weatherInfo = null;
    }

    // 이 요청이 여전히 가장 최근 요청일 때만 화면을 갱신한다.
    if (currentWeatherRequest !== controller) return;

    if (weatherInfo) {
        weatherBox.innerHTML = `
            <p><b>${cityName}</b></p>
            <p>${weatherInfo.weatherEmoji} ${weatherInfo.weatherText}</p>
            <p>🌡️ 기온: ${weatherInfo.temp}°C (체감 ${weatherInfo.feelsLike}°C)</p>
            <p>💧 습도: ${weatherInfo.humidity}%</p>
            <p>🍃 풍속: ${weatherInfo.windSpeed}m/s</p>
        `;
    } else {
        weatherBox.innerHTML = "<p>⚠️ 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>";
    }
});
