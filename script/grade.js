// 학점 계산기 - 과목별로 이수학점, 성적(A+, A0 ...), 전공 여부를 입력받아
// 전체 평점평균과 전공 평점평균을 각각 계산한다. (index.html 편리한 도구)

// 성적을 평점으로 환산하는 표 (4.5 만점 기준).
const GRADE_POINTS = {
    'A+': 4.5,
    'A0': 4.0,
    'B+': 3.5,
    'B0': 3.0,
    'C+': 2.5,
    'C0': 2.0,
    'D+': 1.5,
    'D0': 1.0,
    'F': 0.0,
};

// 계산기 창을 열고, 처음 여는 경우 입력 줄을 3개 만들어 둔다.
function checkGrade() {
    document.querySelector('#grade-backdrop').style.display = 'block';
    document.querySelector('#grade-window').style.display = 'block';

    const rows = document.querySelector('#grade-rows');
    if (rows.children.length === 0) {
        addGradeRow();
        addGradeRow();
        addGradeRow();
    }
}

function closeGradeCalc() {
    document.querySelector('#grade-backdrop').style.display = 'none';
    document.querySelector('#grade-window').style.display = 'none';
}

// 이수학점 선택지(0~18)를 만든다. 기본값은 0학점.
function buildCreditOptions() {
    let options = '';
    for (let i = 0; i <= 18; i++) {
        options += '<option value="' + i + '"' + (i === 0 ? ' selected' : '') + '>' + i + '</option>';
    }
    return options;
}

// 과목명 입력 + 학점 선택 + 성적 선택 + 전공 여부 + 삭제 버튼으로 이루어진 한 줄(tr)을 추가한다.
function addGradeRow() {
    const rows = document.querySelector('#grade-rows');

    const tr = document.createElement('tr');
    tr.innerHTML =
        '<td><input type="text" class="grade-subject" placeholder="과목명"></td>' +
        '<td><select class="grade-credit">' + buildCreditOptions() + '</select></td>' +
        '<td>' +
            '<select class="grade-score">' +
                '<option value="A+">A+</option>' +
                '<option value="A0">A0</option>' +
                '<option value="B+">B+</option>' +
                '<option value="B0" selected>B0</option>' +
                '<option value="C+">C+</option>' +
                '<option value="C0">C0</option>' +
                '<option value="D+">D+</option>' +
                '<option value="D0">D0</option>' +
                '<option value="F">F</option>' +
            '</select>' +
        '</td>' +
        '<td><input type="checkbox" class="grade-major"></td>' +
        '<td><button type="button" class="grade-remove-btn" onclick="removeGradeRow(this)">✕</button></td>';

    rows.appendChild(tr);
}

function removeGradeRow(button) {
    button.closest('tr').remove();
}

// 과목명이 채워진 줄만 모아 전체 평점평균과 전공 평점평균을 학점 가중평균으로 계산한다.
function calculateGPA() {
    const rows = document.querySelectorAll('#grade-rows tr');
    let totalCredits = 0;
    let totalPoints = 0;
    let subjectCount = 0;
    let majorCredits = 0;
    let majorPoints = 0;
    let majorCount = 0;

    rows.forEach(function (row) {
        const subjectName = row.querySelector('.grade-subject').value.trim();
        if (subjectName === '') return; // 과목명을 안 쓴 줄은 계산에서 제외

        const credit = Number(row.querySelector('.grade-credit').value);
        const score = row.querySelector('.grade-score').value;
        const isMajor = row.querySelector('.grade-major').checked;
        const points = credit * GRADE_POINTS[score];

        totalCredits += credit;
        totalPoints += points;
        subjectCount++;

        if (isMajor) {
            majorCredits += credit;
            majorPoints += points;
            majorCount++;
        }
    });

    const resultEl = document.querySelector('#grade-result');

    if (subjectCount === 0) {
        resultEl.innerHTML = '⚠️ 과목명을 입력한 과목이 없습니다.';
        return;
    }

    const overallGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
    const majorGPA = majorCredits > 0 ? majorPoints / majorCredits : 0;

    let html =
        '📚 전체 이수학점: <b>' + totalCredits + '학점</b> (' + subjectCount + '과목)<br>' +
        '📈 전체 평점평균: <b>' + overallGPA.toFixed(2) + ' / 4.5</b><br><br>' +
        '🎓 전공 이수학점: <b>' + majorCredits + '학점</b> (' + majorCount + '과목)<br>' +
        '📈 전공 평점평균: ';

    html += majorCredits > 0
        ? '<b>' + majorGPA.toFixed(2) + ' / 4.5</b>'
        : '<span class="grade-empty-note">전공 과목 없음</span>';

    resultEl.innerHTML = html;
}
