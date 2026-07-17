// 이메일 도메인 select를 선택하면 옆 입력창에 자동으로 채워주는 스크립트 (signUp.html)
document.addEventListener('DOMContentLoaded', function () {
    var domainSelect = document.getElementById('emailDomainSelect');
    var domainInput = document.getElementById('emailDomain');

    if (!domainSelect || !domainInput) {
        return;
    }

    domainSelect.addEventListener('change', function () {
        if (domainSelect.value === '') {
            // "직접 입력"을 고르면 입력창을 비우고 직접 타이핑할 수 있게 한다.
            domainInput.value = '';
            domainInput.readOnly = false;
            domainInput.focus();
        } else {
            // 목록에서 도메인을 고르면 입력창에 그대로 채워주고 수정은 막는다.
            domainInput.value = domainSelect.value;
            domainInput.readOnly = true;
        }
    });
});
