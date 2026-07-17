// 챙겨야 할 품목 목록을 경고창으로 보여주는 도구 (index.html 편리한 도구)
function showMyBag() {
    const myBag = [
        { name: "맥북 충전기", count: 1 },
        { name: "휴대폰 충전기", count: 1 },
        { name: "필통", count: 1 },
        { name: "초콜릿", count: 3 },
        { name: "맥북", count: 1 },
    ];

    const itemLines = myBag.map((item) => `- ${item.name} : ${item.count}개`).join("\n");
    const resultText =
        "🎒 [챙겨야 할 물품 목록]\n" +
        "-----------------------\n" +
        itemLines + "\n" +
        "-----------------------\n" +
        "총 물품 종류: " + myBag.length + "가지";

    alert(resultText);
}
