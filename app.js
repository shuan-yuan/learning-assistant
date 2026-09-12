const $ = (s) => document.querySelector(s);
const views = document.querySelectorAll('.view');
const navButtons = document.querySelectorAll('.bottom-nav button');
let selectedSubject = '数学', imageDataUrl = '', gradedQuestions = [], practiceQuestions = [], practiceIndex = 0, streak = 0;

function showView(id) { views.forEach(v => v.classList.toggle('active', v.id === id)); navButtons.forEach(b => b.classList.toggle('nav-active', b.dataset.open === id || (id === 'homeView' && b.hasAttribute('data-home')))); window.scrollTo({top:0,behavior:'smooth'}); }
function escapeHtml(v = '') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function normalize(v) { return String(v).trim().toLowerCase().replace(/[。！!，,\s]/g, ''); }
document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => showView(b.dataset.open)));
document.querySelectorAll('[data-home]').forEach(b => b.addEventListener('click', () => showView('homeView')));
document.querySelectorAll('[data-subject]').forEach(b => b.addEventListener('click', () => { selectedSubject = b.dataset.subject; document.querySelectorAll('[data-subject]').forEach(i => i.classList.toggle('selected', i === b)); }));

$('#photoInput').addEventListener('change', e => {
  const file = e.target.files?.[0]; if (!file) return;
  if (file.size > 8 * 1024 * 1024) { alert('照片超过 8MB，请选择更小的图片。'); return; }
  const reader = new FileReader(); reader.onload = () => { imageDataUrl = String(reader.result); $('#photoPreview').innerHTML = `<img alt="已选择的作业照片" src="${imageDataUrl}">`; $('#photoPreview').classList.remove('hidden'); $('#gradeBtn').disabled = false; }; reader.readAsDataURL(file);
});

function renderResults(result) {
  gradedQuestions = result.questions || [];
  const correct = gradedQuestions.filter(x => x.is_correct === true).length, wrong = gradedQuestions.filter(x => x.is_correct === false).length, score = correct + wrong ? Math.round(correct / (correct + wrong) * 100) : 0;
  $('#resultHeadline').textContent = wrong ? '找到需要订正的题目了' : '这份作业完成得不错！'; $('#resultSummary').textContent = result.summary || '已完成照片中清晰题目的批改。'; $('#scoreValue').innerHTML = `${score}<small>分</small>`; $('#totalCount').textContent = gradedQuestions.length; $('#correctCount').textContent = correct; $('#wrongCount').textContent = wrong;
  const errors = gradedQuestions.filter(x => x.is_correct === false || x.is_correct === null);
  $('#mistakeList').innerHTML = errors.length ? errors.map(x => `<article><span class="q-num">${escapeHtml(x.number || '?')}</span><div><b>${escapeHtml(x.type || '题目')}</b><p>${escapeHtml(x.prompt || '题目内容未能完整识别')}</p><small><b>你的答案：</b>${escapeHtml(x.student_answer || '未识别')}<br><b>参考答案：</b>${escapeHtml(x.expected_answer || '请查看题目')}<br>${escapeHtml(x.feedback || '请根据题意重新检查。')}</small></div><button class="fix" data-practice-one="${escapeHtml(x.number || '')}">练习</button></article>`).join('') : '<p class="sub">没有发现明确错误；看不清的题目请重新拍摄一张更清晰的照片。</p>';
  document.querySelectorAll('[data-practice-one]').forEach(b => b.addEventListener('click', () => startPractice(b.dataset.practiceOne)));
}

$('#gradeBtn').addEventListener('click', async () => {
  if (!imageDataUrl) return; $('#gradingState').classList.remove('hidden'); $('#gradeBtn').disabled = true;
  try { const res = await fetch('/api/grade', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageDataUrl,subject:selectedSubject})}); const data = await res.json(); if (!res.ok) throw new Error(data.error || '批改失败'); renderResults(data); showView('resultView'); }
  catch (err) { alert(`批改暂未完成：${err.message}`); } finally { $('#gradingState').classList.add('hidden'); $('#gradeBtn').disabled = false; }
});

function makePractice(x) { return {question:`请重新完成：${x.prompt || '这道错题'}`,answer:x.expected_answer || '',weakness:x.concept || '根据错题巩固知识点',lead:x.feedback || '请根据订正建议，重新思考答案。',tip:`原题答案：${x.expected_answer || '请结合题目自行判断'}`,correct:'答对了！你已经掌握了这道错题的知识点。',incorrect:x.feedback || '再看一看订正建议，然后试一次。'}; }
function startPractice(number) { const errors = gradedQuestions.filter(x => x.is_correct === false); practiceQuestions = (number ? errors.filter(x => String(x.number) === String(number)) : errors).map(makePractice); if (!practiceQuestions.length) { alert('这份作业暂时没有可用于练习的已判错题目。'); return; } practiceIndex = 0; streak = 0; renderPractice(); showView('practiceView'); }
$('#practiceFromMistakes').addEventListener('click', e => { e.preventDefault(); startPractice(); });
function renderPractice() { const x = practiceQuestions[practiceIndex]; $('#practiceEyebrow').textContent = `错题巩固 · ${selectedSubject}`; $('#weaknessText').textContent = x.weakness; $('#questionText').textContent = x.question; $('#questionLead').textContent = x.lead; $('#tipText').textContent = x.tip; $('#questionCount').textContent = `第 ${practiceIndex + 1} / ${practiceQuestions.length} 题`; $('#streakText').textContent = `★ 连对 ${streak} 题`; $('#answerInput').value = ''; $('#answerFeedback').textContent = ''; $('#answerFeedback').className = 'feedback'; $('#nextQuestion').classList.add('hidden'); }
document.querySelectorAll('[data-practice-subject]').forEach(b => b.addEventListener('click', () => { selectedSubject = b.dataset.practiceSubject; document.querySelectorAll('[data-practice-subject]').forEach(i => i.classList.toggle('selected', i === b)); if (gradedQuestions.length) startPractice(); }));
$('#checkAnswer').addEventListener('click', () => { const x = practiceQuestions[practiceIndex]; if (!x) return; const correct = normalize($('#answerInput').value) === normalize(x.answer); if (correct) streak += 1; $('#answerFeedback').className = `feedback ${correct ? 'correct' : 'incorrect'}`; $('#answerFeedback').textContent = correct ? x.correct : x.incorrect; $('#streakText').textContent = `★ 连对 ${streak} 题`; $('#nextQuestion').classList.remove('hidden'); });
$('#nextQuestion').addEventListener('click', () => { practiceIndex = (practiceIndex + 1) % practiceQuestions.length; renderPractice(); });
