const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function parseJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1] : text;
  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('模型没有返回可读取的批改结果');
  return JSON.parse(source.slice(start, end + 1));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: '只支持 POST 请求' });
  if (!process.env.DEEPSEEK_API_KEY) return res.status(503).json({ error: '批改服务尚未配置 DeepSeek API Key' });

  try {
    const { imageDataUrl, subject } = req.body || {};
    if (!imageDataUrl || !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(imageDataUrl)) {
      return res.status(400).json({ error: '请上传 JPG、PNG 或 WebP 格式的清晰作业照片' });
    }
    const base64 = imageDataUrl.split(',')[1] || '';
    if (Buffer.byteLength(base64, 'base64') > MAX_IMAGE_BYTES) return res.status(413).json({ error: '照片过大，请控制在 8MB 以内' });

    const instructions = `你是一名严谨、鼓励式的小学作业批改老师。请批改一张${subject || '小学'}作业照片。
只识别照片中清晰可见的题目；看不清的题目不要猜测，标记为 is_correct:null 并说明原因。
数学检查答案和可见的关键步骤；语文检查字词、阅读、修辞、表达题；英语检查拼写、语法、词义和句意。
返回严格 JSON，不要 Markdown：
{
  "subject":"数学|语文|英语",
  "summary":"给孩子的简短鼓励和总评",
  "questions":[{
    "number":"题号",
    "type":"题型",
    "prompt":"题目内容或简短题干",
    "student_answer":"学生答案",
    "expected_answer":"正确答案或参考答案",
    "is_correct":true,
    "feedback":"订正建议，正确题也给简短反馈",
    "concept":"对应知识点"
  }]
}
不要编造不可见的题目或答案。`;

    const apiResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash-vision-exp',
        temperature: 0.1,
        messages: [{ role: 'user', content: [{ type: 'text', text: instructions }, { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } }] }]
      })
    });
    const payload = await apiResponse.json();
    if (!apiResponse.ok) throw new Error(payload?.error?.message || 'AI 服务暂时不可用');
    const result = parseJson(payload.choices?.[0]?.message?.content || '');
    result.questions = Array.isArray(result.questions) ? result.questions : [];
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || '批改失败，请稍后重试' });
  }
}
