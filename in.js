/* in.js — interactions, downloads, animations, EmailJS contact
  IMPORTANT SETUP ITEMS (read before using):
  1) Put your resume file in: assets/documents/resume..pdf (or rename to resume.pdf and update RESUME_FILE).
  2) Put your 6 certificate PDFs in assets/documents/cert1.pdf ... cert6.pdf (or change names below).
  3) Put project PDFs in assets/documents/Voting_System_Summary.pdf etc.
  4) Put images in assets/images/ (profile.jpg, project_voting.png, project_hospital.png, project_datascience.png).
  5) OPTIONAL: To enable contact email sending, sign up at https://www.emailjs.com/ and create a service + template.
     Then set EMAILJS_USER_ID, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID below.
*/

/* ---------------- CONFIG ---------------- */
const DOCS_BASE = 'assets/documents';
const RESUME_FILE = 'resume.pdf'; // change if you renamed file
const CERT_FILES = ['cert1.pdf','cert2.pdf','cert3.pdf','cert4.pdf','cert5.pdf','cert6.pdf'];

const PROJECT_DOCS = {
  voting: 'Voting_System_Summary.pdf',
  hospital: 'Hospital_System_Summary.pdf',
  datascience: 'DataScience_Summary.pdf'
};

// EmailJS (optional) — set your values to enable sending
const EMAILJS_USER_ID = '';   // e.g. 'user_xxx' (from EmailJS dashboard)
const EMAILJS_SERVICE_ID = ''; // e.g. 'service_xxx'
const EMAILJS_TEMPLATE_ID = ''; // e.g. 'template_xxx'

// If you want visitor notifications emailed on every page load (careful with volume):
const SEND_VISITOR_EMAIL_ON_LOAD = false;

/* --------------- Utilities ---------------- */
const qs = (s,p=document)=> p.querySelector(s);
const qsa = (s,p=document)=> Array.from(p.querySelectorAll(s));
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* -------------- DOM Ready ----------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  // 1) reveal sections on scroll
  const sections = qsa('.section');
  const io = new IntersectionObserver(entries=>{
    entries.forEach(entry => {
      if(entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.12 });
  sections.forEach(s=> io.observe(s));

  // 2) animate skill bars (if any)
  animateSkillBars();

  // 3) card & icon actions
  qsa('.icon').forEach(btn => btn.addEventListener('click', ()=> openAnimatedPage(btn.dataset.key)));
  document.body.addEventListener('click', (ev)=>{
    const act = ev.target.closest('[data-action]');
    if(act){
      const key = act.dataset.key;
      if(act.dataset.action === 'open') openAnimatedPage(key);
      else if(act.dataset.action === 'download') downloadDocForKey(key);
    }
    // certificate buttons
    const certBtn = ev.target.closest('[data-cert]');
    if(certBtn){
      const f = certBtn.dataset.cert;
      if(f) downloadFile(f);
    }
    // footer icon links
    const iconLink = ev.target.closest('.icon-link');
    if(iconLink){
      const key = iconLink.dataset.key;
      if(key === 'cv') downloadFile(RESUME_FILE);
      else openAnimatedPage(key);
    }
  });

  // 4) header CV buttons
  qs('#downloadCv')?.addEventListener('click', ()=> downloadFile(RESUME_FILE));
  qs('#downloadCvHeader')?.addEventListener('click', ()=> downloadFile(RESUME_FILE));
  qs('#openCv')?.addEventListener('click', ()=> openAnimatedPage('cv'));

  // 5) resume open/download
  qs('#openResume')?.addEventListener('click', ()=> window.open(`${DOCS_BASE}/${encodeURIComponent(RESUME_FILE)}`, '_blank'));
  qs('#downloadResume')?.addEventListener('click', ()=> downloadFile(RESUME_FILE));

  // 6) contact form -> EmailJS (if configured) or mock
  const form = qs('#contactForm');
  if(form){
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name = qs('#cf-name').value.trim();
      const email = qs('#cf-email').value.trim();
      const message = qs('#cf-message').value.trim();
      if(!name || !email || !message) return alert('Please fill all fields.');

      // show local success toast
      showToast(`Thanks ${name}! Your message was sent.`);

      // send via EmailJS if configured
      if(EMAILJS_USER_ID && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && window.emailjs){
        try{
          const res = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { from_name:name, from_email:email, message:message });
          console.log('EmailJS send result', res);
        }catch(err){ console.warn('EmailJS error', err); }
      } else {
        // fallback: show the visitor toast and log
        console.log('EmailJS not configured — form saved only locally (demo).');
      }
      form.reset();
    });
  }

  // 7) notify/test button (header)
  qs('#notifyMe')?.addEventListener('click', ()=> {
    if(!EMAILJS_USER_ID) { showToast('EmailJS not configured. See in.js to set it.'); return; }
    // send quick test email (requires EmailJS configured)
    if(window.emailjs){
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { from_name:'Portfolio Test', from_email:'noreply@portfolio', message:'This is a test ping from the portfolio.' })
        .then(()=> showToast('Test email sent ✔︎')).catch(()=> showToast('Test email failed'));
    } else showToast('EmailJS script not loaded.');
  });

  // 8) auto show visitor toast and optionally send email on load
  showToast('Welcome — viewing portfolio. Notifications will be sent if configured.', { timeout:5000 });
  if(SEND_VISITOR_EMAIL_ON_LOAD && EMAILJS_USER_ID && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && window.emailjs){
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { from_name:'Visitor Alert', from_email:'noreply@portfolio', message:`Visitor at ${new Date().toISOString()} — ${navigator.userAgent}` })
      .then(()=> console.log('visitor email sent')).catch(()=> console.warn('visitor email error'));
  }
});

/* ------------- helper: animate skill bars ------------- */
function animateSkillBars(){
  qsa('.skill-bar').forEach(sb=>{
    const v = parseInt(sb.dataset.val || '60', 10);
    const el = sb.querySelector('.fill');
    if(el) setTimeout(()=> el.style.width = v+'%', 350);
  });
}

/* ------------- open animated project preview (new tab) ------------- */
function openAnimatedPage(key){
  const info = {
    voting: {title:'Online Voting System', subtitle:'Java Swing • MySQL', body:`<ul><li>Secure login & registration</li><li>Admin dashboard & results</li><li>Vote counting & export</li></ul>`, img:'assets/images/project_voting.png', color:'#00d4ff'},
    hospital: {title:'Hospital Management System', subtitle:'HTML/CSS + Java backend', body:`<ul><li>Patient records & appointments</li><li>Doctor scheduling</li><li>Reports & exports</li></ul>`, img:'assets/images/project_hospital.png', color:'#6ee7b7'},
    datascience: {title:'Data Science Mini Project', subtitle:'Pandas • Matplotlib', body:`<ul><li>Data cleaning & visualization</li><li>Sales & trend analysis</li><li>Charts & observations</li></ul>`, img:'assets/images/project_datascience.png', color:'#ffb86b'},
    cv: {title:'Curriculum Vitae', subtitle:'Resume (downloadable)', body:`<p>Open or download the full resume from the buttons below.</p>`, img:'', color:'#00d4ff'}
  }[key];

  if(!info){ alert('No preview available for: ' + key); return; }
  const w = window.open('', '_blank', 'noopener');
  if(!w){ alert('Popup blocked — allow popups for this site.'); return; }

  // preview HTML
  const docUrl = key === 'cv' ? `${DOCS_BASE}/${encodeURIComponent(RESUME_FILE)}` : `${DOCS_BASE}/${encodeURIComponent(PROJECT_DOCS[key] || '')}`;

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(info.title)}</title>
    <style>
      body{font-family:Inter,Arial,Helvetica,sans-serif;background:linear-gradient(180deg,#031022 0%,#061120 100%);color:#eaf6ff;margin:0;padding:24px}
      .wrap{max-width:900px;margin:0 auto}
      h1{color:${info.color};margin:0 0 6px}
      .sub{color:#bcd5e6;margin-bottom:18px}
      .card{background:rgba(255,255,255,0.02);padding:18px;border-radius:12px}
      img{width:100%;border-radius:10px;margin-bottom:12px}
      button{padding:10px 12px;border-radius:8px;border:none;cursor:pointer;margin-right:8px}
      .primary{background:${info.color};color:#012}
    </style></head><body>
      <div class="wrap">
        <h1>${escapeHtml(info.title)}</h1>
        <div class="sub">${escapeHtml(info.subtitle)}</div>
        ${info.img ? `<img src="${info.img}" alt="${escapeHtml(info.title)}">` : ''}
        <div class="card">${info.body}</div>
        <div style="margin-top:12px">
          <button onclick="window.print()">Print</button>
          <button class="primary" onclick="window.open('${docUrl}','_blank')">Open Doc</button>
        </div>
      </div>
    </body></html>`;
  w.document.write(html);
  w.document.close();
}

/* -------- downloads -------- */

function downloadFile(filename) {
  if (!filename) {
    alert('No file specified');
    return;
  }

  const url = `${DOCS_BASE}/${encodeURIComponent(filename)}`;
  console.log("Downloading file:", url);

  // Try to fetch and download (better than just opening)
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("File not found");
      return response.blob();
    })
    .then(blob => {
      const link = document.createElement('a');
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      console.log("File downloaded successfully:", filename);
    })
    .catch(err => {
      console.error("Download failed:", err);
      alert("Download failed — please check if the file exists in assets/documents/");
    });
}

function downloadDocForKey(key){
  const file = PROJECT_DOCS[key];
  if(!file) { alert('No document available'); return; }
  downloadFile(file);
}

/* -------- toast -------- */
function showToast(msg, opts={timeout:6000}){
  const t = qs('#visitor-toast');
  if(!t) return alert(msg);
  t.querySelector('.toast-text').innerHTML = `<strong>Info:</strong> ${escapeHtml(msg)}`;
  t.classList.remove('hidden');
  if(!opts.persistent) setTimeout(()=> t.classList.add('hidden'), opts.timeout || 6000);
}
qs?.('#closeToast')?.addEventListener?.('click', ()=> qs('#visitor-toast')?.classList.add('hidden'));
