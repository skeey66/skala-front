// 숫자야구 - 서로 다른 숫자 3자리로 이루어진 컴퓨터의 비밀 번호를 맞추는 게임.
// 자리와 숫자가 모두 맞으면 스트라이크, 숫자만 맞으면 볼, 하나도 없으면 아웃이다.

const BASEBALL_DIGITS = 3;

let baseballSecret = '';
let baseballAttempts = 0;
let baseballGameOver = false;

// 창을 열고 처음 여는 거라면 엔터키로도 확인할 수 있게 입력창에 리스너를 달아둔다.
function openBaseballGame() {
    document.querySelector('#baseball-backdrop').style.display = 'block';
    document.querySelector('#baseball-window').style.display = 'block';

    const input = document.querySelector('#baseball-guess');
    if (!input.dataset.bound) {
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                submitBaseballGuess();
            }
        });
        input.dataset.bound = 'true';
    }

    startBaseballGame();
}

function closeBaseballGame() {
    document.querySelector('#baseball-backdrop').style.display = 'none';
    document.querySelector('#baseball-window').style.display = 'none';
}

// 0~9 중 서로 다른 숫자 3개를 뽑아 비밀 번호를 만든다.
function generateBaseballSecret() {
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    for (let i = digits.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = digits[i];
        digits[i] = digits[j];
        digits[j] = temp;
    }
    return digits.slice(0, BASEBALL_DIGITS).join('');
}

function startBaseballGame() {
    baseballSecret = generateBaseballSecret();
    baseballAttempts = 0;
    baseballGameOver = false;

    document.querySelector('#baseball-status').textContent =
        '⚾ 서로 다른 숫자 ' + BASEBALL_DIGITS + '자리를 맞춰보세요!';
    document.querySelector('#baseball-log-rows').innerHTML = '';

    const input = document.querySelector('#baseball-guess');
    input.value = '';
    input.disabled = false;
    input.focus();
}

// 입력값이 "서로 다른 숫자 3자리"인지 검사한다. 문제가 있으면 이유 문자열을, 없으면 null을 돌려준다.
function validateBaseballGuess(guess) {
    if (!/^[0-9]+$/.test(guess)) {
        return '숫자만 입력해 주세요.';
    }
    if (guess.length !== BASEBALL_DIGITS) {
        return BASEBALL_DIGITS + '자리 숫자를 입력해 주세요.';
    }
    if (new Set(guess.split('')).size !== BASEBALL_DIGITS) {
        return '숫자가 서로 겹치지 않게 입력해 주세요.';
    }
    return null;
}

function submitBaseballGuess() {
    if (baseballGameOver) return;

    const input = document.querySelector('#baseball-guess');
    const guess = input.value.trim();
    const statusEl = document.querySelector('#baseball-status');

    const errorMessage = validateBaseballGuess(guess);
    if (errorMessage) {
        statusEl.textContent = '⚠️ ' + errorMessage;
        return;
    }

    baseballAttempts++;

    let strikes = 0;
    let balls = 0;
    for (let i = 0; i < BASEBALL_DIGITS; i++) {
        if (guess[i] === baseballSecret[i]) {
            strikes++;
        } else if (baseballSecret.indexOf(guess[i]) !== -1) {
            balls++;
        }
    }

    let resultText;
    if (strikes === BASEBALL_DIGITS) {
        resultText = '🎉 홈런!';
    } else if (strikes === 0 && balls === 0) {
        resultText = '❌ 아웃';
    } else {
        resultText = '⚾ ' + strikes + '스트라이크 ' + balls + '볼';
    }

    addBaseballLogRow(baseballAttempts, guess, resultText);

    if (strikes === BASEBALL_DIGITS) {
        baseballGameOver = true;
        statusEl.textContent =
            '🎉 정답입니다! ' + baseballAttempts + '번 만에 ' + baseballSecret + '를 맞추셨습니다.';
        input.disabled = true;
    } else {
        statusEl.textContent = '⚾ ' + baseballAttempts + '번째 시도 결과를 확인하고 다음 숫자를 입력해 보세요.';
        input.value = '';
        input.focus();
    }
}

function addBaseballLogRow(round, guess, resultText) {
    const rows = document.querySelector('#baseball-log-rows');
    const tr = document.createElement('tr');
    tr.innerHTML =
        '<td>' + round + '</td>' +
        '<td>' + guess + '</td>' +
        '<td>' + resultText + '</td>';
    rows.appendChild(tr);
}
