// 화살피하기 - 죽림고수 스타일의 화살 피하기 미니게임.
// 방향키(또는 WASD)로 캐릭터를 움직여서 사방에서 날아오는 화살을 피하고,
// 오래 버틸수록 화살이 점점 자주 날아옵니다.

const ARROW_CANVAS_SIZE = 320;
const PLAYER_RADIUS = 10;
const PLAYER_SPEED = 220; // px/초
const ARROW_SPEED = 220; // px/초
const ARROW_HEAD_RADIUS = 5;

let arrowCtx = null;
let arrowPlayer = { x: ARROW_CANVAS_SIZE / 2, y: ARROW_CANVAS_SIZE / 2 };
let arrowList = [];
let arrowKeys = {};
let arrowGameActive = false;
let arrowGameOver = false;
let arrowStartTime = 0;
let arrowElapsed = 0;
let arrowSpawnTimer = 0;
let arrowSpawnInterval = 1000; // ms, 시간이 지날수록 점점 짧아진다
let arrowLastFrameTime = 0;
let arrowAnimationId = null;
let arrowBestScore = 0;

// 창을 열고 키보드 리스너를 (최초 1회만) 연결한 뒤 게임을 시작한다.
function openArrowGame() {
    document.querySelector('#arrow-backdrop').style.display = 'block';
    document.querySelector('#arrow-window').style.display = 'block';

    if (!arrowCtx) {
        const canvas = document.querySelector('#arrow-canvas');
        arrowCtx = canvas.getContext('2d');
        window.addEventListener('keydown', onArrowKeyDown);
        window.addEventListener('keyup', onArrowKeyUp);
    }

    startArrowGame();
}

function closeArrowGame() {
    document.querySelector('#arrow-backdrop').style.display = 'none';
    document.querySelector('#arrow-window').style.display = 'none';
    arrowGameActive = false;
    if (arrowAnimationId) {
        cancelAnimationFrame(arrowAnimationId);
        arrowAnimationId = null;
    }
}

// 게임 창이 열려있을 때만 방향키를 게임 조작으로 사용하고, 페이지 스크롤은 막는다.
function onArrowKeyDown(event) {
    if (!arrowGameActive) return;
    const key = event.key.toLowerCase();
    const usedKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'];
    if (usedKeys.indexOf(key) !== -1) {
        event.preventDefault();
        arrowKeys[key] = true;
    }
}

function onArrowKeyUp(event) {
    arrowKeys[event.key.toLowerCase()] = false;
}

function startArrowGame() {
    arrowPlayer = { x: ARROW_CANVAS_SIZE / 2, y: ARROW_CANVAS_SIZE / 2 };
    arrowList = [];
    arrowKeys = {};
    arrowGameOver = false;
    arrowGameActive = true;
    arrowStartTime = performance.now();
    arrowLastFrameTime = arrowStartTime;
    arrowElapsed = 0;
    arrowSpawnTimer = 0;
    arrowSpawnInterval = 1000;

    document.querySelector('#arrow-status').textContent = '🏹 방향키(WASD)로 움직여서 화살을 피하세요!';
    document.querySelector('#arrow-score').textContent =
        '⏱ 생존 시간: 0.0초' + (arrowBestScore > 0 ? ' (최고 기록: ' + arrowBestScore.toFixed(1) + '초)' : '');

    if (arrowAnimationId) {
        cancelAnimationFrame(arrowAnimationId);
    }
    arrowAnimationId = requestAnimationFrame(arrowGameLoop);
}

function arrowGameLoop(now) {
    const dt = Math.min((now - arrowLastFrameTime) / 1000, 0.05); // 초 단위, 탭 전환 등으로 델타가 튀는 것 방지
    arrowLastFrameTime = now;

    if (!arrowGameOver) {
        updateArrowPlayer(dt);
        updateArrowSpawning(dt);
        updateArrows(dt);
        checkArrowCollision();

        if (!arrowGameOver) {
            arrowElapsed = (now - arrowStartTime) / 1000;
            document.querySelector('#arrow-score').textContent = '⏱ 생존 시간: ' + arrowElapsed.toFixed(1) + '초';
        }
    }

    drawArrowScene();

    if (arrowGameActive && !arrowGameOver) {
        arrowAnimationId = requestAnimationFrame(arrowGameLoop);
    }
}

function updateArrowPlayer(dt) {
    let dx = 0;
    let dy = 0;
    if (arrowKeys['arrowup'] || arrowKeys['w']) dy -= 1;
    if (arrowKeys['arrowdown'] || arrowKeys['s']) dy += 1;
    if (arrowKeys['arrowleft'] || arrowKeys['a']) dx -= 1;
    if (arrowKeys['arrowright'] || arrowKeys['d']) dx += 1;

    if (dx !== 0 && dy !== 0) {
        dx *= Math.SQRT1_2; // 대각선 이동이 더 빨라지지 않도록 정규화
        dy *= Math.SQRT1_2;
    }

    arrowPlayer.x += dx * PLAYER_SPEED * dt;
    arrowPlayer.y += dy * PLAYER_SPEED * dt;

    arrowPlayer.x = Math.max(PLAYER_RADIUS, Math.min(ARROW_CANVAS_SIZE - PLAYER_RADIUS, arrowPlayer.x));
    arrowPlayer.y = Math.max(PLAYER_RADIUS, Math.min(ARROW_CANVAS_SIZE - PLAYER_RADIUS, arrowPlayer.y));
}

function updateArrowSpawning(dt) {
    arrowSpawnTimer += dt * 1000;
    if (arrowSpawnTimer >= arrowSpawnInterval) {
        arrowSpawnTimer = 0;
        spawnArrow();
        // 생존 시간이 늘어날수록 화살 간격이 짧아지되, 너무 촘촘해지지 않게 최소값을 둔다.
        arrowSpawnInterval = Math.max(280, 1000 - arrowElapsed * 25);
    }
}

// 화면 네 변 중 무작위 위치에서 화살을 만들어, 스폰 시점의 플레이어 위치(약간의 오차 포함)를 향해 쏜다.
function spawnArrow() {
    const edge = Math.floor(Math.random() * 4); // 0:위 1:아래 2:왼쪽 3:오른쪽
    let x, y;

    if (edge === 0) { x = Math.random() * ARROW_CANVAS_SIZE; y = -10; }
    else if (edge === 1) { x = Math.random() * ARROW_CANVAS_SIZE; y = ARROW_CANVAS_SIZE + 10; }
    else if (edge === 2) { x = -10; y = Math.random() * ARROW_CANVAS_SIZE; }
    else { x = ARROW_CANVAS_SIZE + 10; y = Math.random() * ARROW_CANVAS_SIZE; }

    const targetX = arrowPlayer.x + (Math.random() - 0.5) * 60;
    const targetY = arrowPlayer.y + (Math.random() - 0.5) * 60;
    const angle = Math.atan2(targetY - y, targetX - x);
    const speed = ARROW_SPEED + Math.random() * 60;

    arrowList.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: angle,
    });
}

function updateArrows(dt) {
    for (let i = arrowList.length - 1; i >= 0; i--) {
        const a = arrowList[i];
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        if (a.x < -40 || a.x > ARROW_CANVAS_SIZE + 40 || a.y < -40 || a.y > ARROW_CANVAS_SIZE + 40) {
            arrowList.splice(i, 1); // 화면 밖으로 나간 화살은 정리
        }
    }
}

function checkArrowCollision() {
    for (let i = 0; i < arrowList.length; i++) {
        const a = arrowList[i];
        const dx = a.x - arrowPlayer.x;
        const dy = a.y - arrowPlayer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < PLAYER_RADIUS + ARROW_HEAD_RADIUS) {
            endArrowGame();
            return;
        }
    }
}

function endArrowGame() {
    arrowGameOver = true;
    if (arrowElapsed > arrowBestScore) {
        arrowBestScore = arrowElapsed;
    }
    document.querySelector('#arrow-status').textContent = '💥 화살에 맞았습니다! 다시하기를 눌러 재도전하세요.';
    document.querySelector('#arrow-score').textContent =
        '⏱ 생존 시간: ' + arrowElapsed.toFixed(1) + '초 (최고 기록: ' + arrowBestScore.toFixed(1) + '초)';
}

function drawArrowScene() {
    const ctx = arrowCtx;
    if (!ctx) return;

    ctx.fillStyle = '#f2ede0';
    ctx.fillRect(0, 0, ARROW_CANVAS_SIZE, ARROW_CANVAS_SIZE);

    // 은은한 점 패턴 (사이트 데스크탑 배경과 통일감)
    ctx.fillStyle = 'rgba(111, 107, 92, 0.15)';
    for (let x = 10; x < ARROW_CANVAS_SIZE; x += 20) {
        for (let y = 10; y < ARROW_CANVAS_SIZE; y += 20) {
            ctx.fillRect(x, y, 1.5, 1.5);
        }
    }

    arrowList.forEach(function (a) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);
        ctx.fillStyle = '#8a4a2f';
        ctx.fillRect(-16, -1.5, 16, 3); // 화살대
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, -5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fillStyle = '#c0392b';
        ctx.fill(); // 화살촉
        ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(arrowPlayer.x, arrowPlayer.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#2f6e5c';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f4f1e6';
    ctx.stroke();

    if (arrowGameOver) {
        ctx.fillStyle = 'rgba(20, 22, 18, 0.55)';
        ctx.fillRect(0, 0, ARROW_CANVAS_SIZE, ARROW_CANVAS_SIZE);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥 GAME OVER', ARROW_CANVAS_SIZE / 2, ARROW_CANVAS_SIZE / 2);
    }
}
