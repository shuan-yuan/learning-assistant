const $ = (s) => document.querySelector(s);
const views = document.querySelectorAll('.view');
const navButtons = document.querySelectorAll('.bottom-nav button');
const exercises = {
  数学: [
    { question:'48 ÷ 6 + 17 = ?', answer:'25', weakness:'四则混合运算：先算乘除，后算加减', lead:'先算一算，再填写答案：', tip:'计算时要先完成除法，再进行加法哦。', correct:'答对了！48 ÷ 6 = 8，8 + 17 = 25。', incorrect:'再想一想：先计算 48 ÷ 6，得到 8。' },
    { question:'63 ÷ 9 + 16 = ?', answer:'23', weakness:'四则混合运算：先算乘除，后算加减', lead:'先算一算，再填写答案：', tip:'先把除法算完，再完成加法。', correct:'答对了！63 ÷ 9 = 7，7 + 16 = 23。', incorrect:'先计算 63 ÷ 9，得到 7。' }
  ],
  语文: [
    { question:'“小鸟在枝头唱歌”运用了什么修辞手法？', answer:'拟人', weakness:'修辞手法辨析：拟人', lead:'根据句子的表达方式，填写修辞手法：', tip:'把人的动作或情感写在非人的事物上，就是拟人。', correct:'答对了！“唱歌”是人的动作，小鸟被赋予人的行为。', incorrect:'想一想：句中是否把人的动作写给了小鸟？' },
    { question:'“月亮像一盏明灯挂在夜空”运用了什么修辞手法？', answer:'比喻', weakness:'修辞手法辨析：比喻', lead:'根据句子的表达方式，填写修辞手法：', tip:'看到“像、好像、仿佛”等词时，可以想想是不是比喻。', correct:'答对了！这里把月亮比作明灯。', incorrect:'注意“像”这个提示词：它把月亮比成了什么？' }
  ],
  英语: [
    { question:'Yesterday I ___ (go) to the library.', answer:'went', weakness:'一般过去时：不规则动词 go → went', lead:'根据句意，填写括号中动词的正确形式：', tip:'看到 Yesterday，要使用过去式；go 的过去式是不规则变化。', correct:'Excellent! “Yesterday” tells us to use the past tense: went.', incorrect:'Hint: go 的过去式不是 goed，而是 went。' },
    { question:'She ___ (have) a new book last week.', answer:'had', weakness:'一般过去时：不规则动词 have → had', lead:'根据句意，填写括号中动词的正确形式：', tip:'last week 表示过去；have 的过去式是 had。', correct:'Great job! “last week” needs the past tense: had.', incorrect:'Hint: have 的过去式是 had。' }
  ]
};
let currentSubject = '数学', questionIndex = 0, streak = 0;
function showView(id) { views.forEach(v => v.classList.toggle('active', v.id === id)); navButtons.forEach(b => b.classList.toggle('nav-active', b.dataset.open === id || (id === 'homeView' && b.hasAttribute('data-home')))); window.scrollTo({top:0,behavior:'smooth'}); }
function normalize(value) { return value.trim().toLowerCase().replace(/[。！!，,\s]/g, ''); }
function renderQuestion() { const item = exercises[currentSubject][questionIndex]; $('#practiceEyebrow').textContent = `错题巩固 · ${currentSubject}`; $('#weaknessText').textContent = item.weakness; $('#questionText').textContent = item.question; $('#questionLead').textContent = item.lead; $('#tipText').textContent = item.tip; $('#questionCount').textContent = `第 ${questionIndex + 1} / 5 题`; $('#streakText').textContent = `★ 连对 ${streak} 题`; $('#answerInput').value = ''; $('#answerInput').placeholder = currentSubject === '数学' ? '输入数字答案' : '输入答案'; $('#answerInput').inputMode = currentSubject === '数学' ? 'numeric' : 'text'; $('#answerFeedback').textContent = ''; $('#answerFeedback').className = 'feedback'; $('#nextQuestion').classList.add('hidden'); }
document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => showView(b.dataset.open)));
document.querySelectorAll('[data-home]').forEach(b => b.addEventListener('click', () => showView('homeView')));
document.querySelectorAll('[data-subject]').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('[data-subject]').forEach(i => i.classList.remove('selected')); b.classList.add('selected'); }));
document.querySelectorAll('[data-practice-subject]').forEach(b => b.addEventListener('click', () => { currentSubject = b.dataset.practiceSubject; questionIndex = 0; streak = 0; document.querySelectorAll('[data-practice-subject]').forEach(i => i.classList.toggle('selected', i === b)); renderQuestion(); }));
$('#photoInput').addEventListener('change', e => { const file = e.target.files?.[0]; if (!file) return; const preview = $('#photoPreview'); preview.innerHTML = `<img alt="已选择的作业照片" src="${URL.createObjectURL(file)}">`; preview.classList.remove('hidden'); $('#gradeBtn').disabled = false; });
$('#gradeBtn').addEventListener('click', () => { $('#gradingState').classList.remove('hidden'); $('#gradeBtn').disabled = true; setTimeout(() => { $('#gradingState').classList.add('hidden'); showView('resultView'); }, 1300); });
$('#checkAnswer').addEventListener('click', () => { const item = exercises[currentSubject][questionIndex], feedback = $('#answerFeedback'), correct = normalize($('#answerInput').value) === normalize(item.answer); if (correct) streak += 1; feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`; feedback.textContent = correct ? item.correct : item.incorrect; $('#streakText').textContent = `★ 连对 ${streak} 题`; $('#nextQuestion').classList.remove('hidden'); });
$('#nextQuestion').addEventListener('click', () => { questionIndex = (questionIndex + 1) % exercises[currentSubject].length; renderQuestion(); });
renderQuestion();
