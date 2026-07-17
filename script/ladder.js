// 사다리타기 - 위쪽 참가자 이름을 클릭하면 사다리를 타고 내려가서
// 아래쪽 어떤 결과에 도착하는지 애니메이션으로 보여준다.

const LADDER_ROWS = 14; // 사다리 가로줄이 놓일 수 있는 층 수
const LADDER_CANVAS_WIDTH = 300;
const LADDER_CANVAS_HEIGHT = 240;

let ladderCount = 4;
let ladderRungs = []; // ladderRungs[row] = Set<col> : col과 col+1 사이에 가로줄이 있으면 포함
let ladderCtx = null;
let ladderTracing = false;

function openLadderGame() {
    document.querySelector('#ladder-backdrop').style.display = 'block';
    document.querySelector('#ladder-window').style.display = 'block';

    if (!ladderCtx) {
        ladderCtx = document.querySelector('#ladder-canvas').getContext('2d');
    }

    rebuildLadder();
}

function closeLadderGame() {
    document.querySelector('#ladder-backdrop').style.display = 'none';
    document.querySelector('#ladder-window').style.display = 'none';
}

// 인원수를 바꾸거나 "새 사다리" 버튼을 누르면 사다리를 완전히 새로 만든다.
function rebuildLadder() {
    ladderCount = Number(document.querySelector('#ladder-count').value);
    ladderRungs = generateLadderRungs(ladderCount);
    ladderTracing = false;

    renderLadderNameInputs();
    drawLadder();

    document.querySelector('#ladder-status').textContent = '🪜 위 이름을 클릭하면 결과를 확인할 수 있어요!';
}

// 매 층마다, 겹치지 않는 선에서 무작위로 가로줄(발판)을 놓는다.
function generateLadderRungs(count) {
    const rows = [];
    for (let r = 0; r < LADDER_ROWS; r++) {
        const usedCols = new Set();
        const rowRungs = new Set();
        for (let c = 0; c < count - 1; c++) {
            if (usedCols.has(c)) continue; // 바로 왼쪽 칸이 이미 가로줄을 썼으면 겹치므로 건너뜀
            if (Math.random() < 0.35) {
                rowRungs.add(c);
                usedCols.add(c);
                usedCols.add(c + 1);
            }
        }
        rows.push(rowRungs);
    }
    return rows;
}

// 참가자(위쪽)/결과(아래쪽) 이름 입력창을 인원수만큼 새로 그린다.
function renderLadderNameInputs() {
    const topWrap = document.querySelector('#ladder-top-names');
    const bottomWrap = document.querySelector('#ladder-bottom-names');
    topWrap.innerHTML = '';
    bottomWrap.innerHTML = '';

    for (let i = 0; i < ladderCount; i++) {
        const topInput = document.createElement('input');
        topInput.type = 'text';
        topInput.className = 'ladder-name-input ladder-top-input';
        topInput.value = '참가자' + (i + 1);
        topInput.dataset.col = String(i);
        topInput.addEventListener('click', function () {
            traceLadder(Number(topInput.dataset.col));
        });
        topWrap.appendChild(topInput);

        const bottomInput = document.createElement('input');
        bottomInput.type = 'text';
        bottomInput.className = 'ladder-name-input';
        bottomInput.value = '결과' + (i + 1);
        bottomInput.id = 'ladder-bottom-' + i;
        bottomWrap.appendChild(bottomInput);
    }
}

function getLadderColumnX(col) {
    const spacing = LADDER_CANVAS_WIDTH / ladderCount;
    return spacing * (col + 0.5);
}

// 사다리 세로줄 + 가로줄을 그리고, highlightPath가 있으면 그 위에 강조 경로를 덧그린다.
function drawLadder(highlightPath) {
    const ctx = ladderCtx;
    ctx.fillStyle = '#f2ede0';
    ctx.fillRect(0, 0, LADDER_CANVAS_WIDTH, LADDER_CANVAS_HEIGHT);

    const rowHeight = LADDER_CANVAS_HEIGHT / LADDER_ROWS;

    ctx.strokeStyle = '#6f6b5c';
    ctx.lineWidth = 2;
    for (let c = 0; c < ladderCount; c++) {
        const x = getLadderColumnX(c);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, LADDER_CANVAS_HEIGHT);
        ctx.stroke();
    }

    ctx.strokeStyle = '#8a4a2f';
    ctx.lineWidth = 3;
    ladderRungs.forEach(function (rowRungs, r) {
        const y = rowHeight * (r + 0.5);
        rowRungs.forEach(function (c) {
            ctx.beginPath();
            ctx.moveTo(getLadderColumnX(c), y);
            ctx.lineTo(getLadderColumnX(c + 1), y);
            ctx.stroke();
        });
    });

    if (highlightPath && highlightPath.length > 1) {
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        highlightPath.forEach(function (point, idx) {
            if (idx === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    }
}

// startCol에서 출발해 규칙대로 사다리를 타고 내려갔을 때 지나는 좌표들을 순서대로 계산한다.
function computeLadderPath(startCol) {
    const rowHeight = LADDER_CANVAS_HEIGHT / LADDER_ROWS;
    let col = startCol;
    const path = [{ x: getLadderColumnX(col), y: 0 }];

    for (let r = 0; r < LADDER_ROWS; r++) {
        const y = rowHeight * (r + 0.5);
        const rowRungs = ladderRungs[r];

        if (rowRungs.has(col)) {
            path.push({ x: getLadderColumnX(col), y: y });
            col = col + 1;
            path.push({ x: getLadderColumnX(col), y: y });
        } else if (rowRungs.has(col - 1)) {
            path.push({ x: getLadderColumnX(col), y: y });
            col = col - 1;
            path.push({ x: getLadderColumnX(col), y: y });
        }
    }

    path.push({ x: getLadderColumnX(col), y: LADDER_CANVAS_HEIGHT });
    return { path: path, endCol: col };
}

function traceLadder(startCol) {
    if (ladderTracing) return;
    ladderTracing = true;

    const result = computeLadderPath(startCol);
    animateLadderTrace(result.path, startCol, result.endCol);
}

function animateLadderTrace(fullPath, startCol, endCol) {
    let step = 2;

    function drawStep() {
        drawLadder(fullPath.slice(0, step));

        if (step < fullPath.length) {
            step += 2;
            setTimeout(drawStep, 40);
        } else {
            ladderTracing = false;
            showLadderResult(startCol, endCol);
        }
    }

    drawStep();
}

function showLadderResult(startCol, endCol) {
    const topInputs = document.querySelectorAll('.ladder-top-input');
    const topName = topInputs[startCol].value.trim() || ('참가자' + (startCol + 1));

    const bottomInput = document.querySelector('#ladder-bottom-' + endCol);
    const bottomName = bottomInput.value.trim() || ('결과' + (endCol + 1));

    document.querySelector('#ladder-status').textContent = '🪜 ' + topName + ' → ' + bottomName + ' 입니다!';

    bottomInput.classList.add('ladder-result-highlight');
    setTimeout(function () {
        bottomInput.classList.remove('ladder-result-highlight');
    }, 1500);
}
