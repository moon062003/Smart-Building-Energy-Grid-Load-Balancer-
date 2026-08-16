const sidebar=document.getElementById('sidebar');

function toggleMobileMenu(event) {
  if (event) event.stopPropagation();
  if (!sidebar) return;
  sidebar.classList.toggle('open');
  closeProfileMenu();
  closePortfolioMenu();
  closeBuildingMenu();
  closeSearchResults();
}
let toastTimer;
const SESSION_AUTH_KEY='gridbalanceSessionLoggedIn';
const SESSION_PAGE_KEY='gridbalanceActivePage';

function sessionSet(key,value) {
  try {
    sessionStorage.setItem(key,value)
  } catch(error) {
  }
}

function sessionGet(key) {
  try {
    return sessionStorage.getItem(key)
  } catch(error) {
    return null
  }
}

function sessionRemove(key) {
  try {
    sessionStorage.removeItem(key)
  } catch(error) {
  }
}

function enterApp() {
  sessionSet(SESSION_AUTH_KEY,'true');
  document.getElementById('login').style.display='none';
  document.getElementById('app').style.display='grid';
  go(sessionGet(SESSION_PAGE_KEY)||'overview');
  toast('Welcome back, Moon')
}

function go(page) {
  const target=document.getElementById(page);
  if(!target) {
    toast('Page not found: '+page);
    return
  }
  document.querySelectorAll('.page-view').forEach(x=> {
    x.classList.remove('active');if(x.id==='balancer')x.classList.remove('loadBalancerAnimate')
  });
  target.classList.add('active');
  if(page==='balancer'&&typeof replayLoadBalancerAnimation==='function')requestAnimationFrame(()=>replayLoadBalancerAnimation(target));
  document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
  sessionSet(SESSION_PAGE_KEY,page);
  sidebar.classList.remove('open');
  closeProfileMenu();
  closePortfolioMenu();
  window.scrollTo( {
    top:0,behavior:'smooth'
  })
}

function initNavigation() {
  document.querySelectorAll('#nav button[data-page]').forEach(btn=> {
    btn.type='button';btn.addEventListener('click',()=>go(btn.dataset.page))
  });
  updateLiveDateTime();
  setInterval(updateLiveDateTime,1000);
  restoreSessionLogin()
}

function restoreSessionLogin() {
  if(sessionGet(SESSION_AUTH_KEY)==='true') {
    const page=sessionGet(SESSION_PAGE_KEY)||'overview';
    document.getElementById('login').style.display='none';
    document.getElementById('app').style.display='grid';
    const finish=()=> {
      go(page);
      document.documentElement.classList.remove('session-restoring')
    };
    if(document.documentElement.classList.contains('session-restoring'))setTimeout(finish,500);
    else finish()
  } else {
    document.documentElement.classList.remove('session-restoring')
  }
}

function updateLiveDateTime() {
  const el=document.getElementById('liveDateTime');
  if(!el)return;
  const now=new Date();
  const date=now.toLocaleDateString(undefined, {
    weekday:'short',month:'short',day:'numeric',year:'numeric'
  });
  const time=now.toLocaleTimeString(undefined, {
    hour:'2-digit',minute:'2-digit',second:'2-digit'
  });
  el.textContent=date+' - '+time
}

function toggleProfileMenu(event) {
  event.stopPropagation();
  document.getElementById('profileMenu').classList.toggle('show');
  document.getElementById('profileTrigger').classList.toggle('open')
}

function closeProfileMenu() {
  const menu=document.getElementById('profileMenu');
  const trigger=document.getElementById('profileTrigger');
  if(menu)menu.classList.remove('show');
  if(trigger)trigger.classList.remove('open')
}

function togglePortfolioMenu(event) {
  event.stopPropagation();
  closeProfileMenu();
  const menu=document.getElementById('portfolioMenu');
  if(menu)menu.classList.toggle('show')
}

function closePortfolioMenu() {
  const menu=document.getElementById('portfolioMenu');
  if(menu)menu.classList.remove('show')
}

const portfolioState= {

  meridian: {
    label:'Portfolio: Meridian Real Estate',name:'Meridian Real Estate',detail:'3 active commercial buildings',buildingKey:'all',openAlerts:'3',approvals:'2 pending',assigned:'3 active',org:'Meridian Real Estate'
  },
  downtown: {
    label:'Portfolio: Downtown Campus',name:'Downtown Campus',detail:'Office campus and retail block',buildingKey:'downtown',openAlerts:'1',approvals:'1 pending',assigned:'1 active',org:'Downtown Campus'
  },
  north: {
    label:'Portfolio: North Tower Group',name:'North Tower Group',detail:'High-rise tower portfolio',buildingKey:'north',openAlerts:'2',approvals:'1 pending',assigned:'2 active',org:'North Tower Group'
  }
};

function portfolioKeyFromLabel(label) {
  const clean=String(label||'').replace('Portfolio: ','').trim().toLowerCase();
  return Object.keys(portfolioState).find(key=>portfolioState[key].name.toLowerCase()===clean)||'meridian'
}

function setProfileSummaryValue(label,value) {
  document.querySelectorAll('.summary-row').forEach(row=> {
    const name=row.querySelector('span');const target=row.querySelector('b');if(name&&target&&name.textContent.trim()===label)target.textContent=value
  })
}

function applyPortfolioSelection(key,notify=false) {
  const data=portfolioState[key]||portfolioState.meridian;
  const label=document.getElementById('portfolioLabel');
  if(label)label.textContent=data.label;
  document.querySelectorAll('#portfolioMenu button').forEach(btn=> {
    const selected=btn.textContent.includes(data.name);btn.classList.toggle('selected',selected);btn.setAttribute('aria-selected',selected?'true':'false');const marker=btn.querySelector('span:last-child');if(marker) {
      marker.classList.toggle('check',selected);marker.textContent=selected?'✓':''
    }
  });
  const trigger=document.getElementById('portfolioTrigger');
  if(trigger)trigger.title='Switch portfolio - '+data.detail;
  selectedBuildingKey=data.buildingKey;
  if(typeof applyBuildingFilter==='function')applyBuildingFilter(data.buildingKey);
  if(typeof syncAlertCounters==='function') {
    syncAlertCounters()
  } else {
    const alerts=document.getElementById('topAlertBadge');
    if(alerts)alerts.textContent=data.openAlerts;
    const profileAlerts=document.getElementById('profileOpenAlerts');
    if(profileAlerts)profileAlerts.textContent=data.openAlerts;
  }
  const approval=document.getElementById('profileApprovalCount');
  if(approval)approval.textContent=data.approvals;
  setProfileSummaryValue('Assigned buildings',data.assigned);
  const profileTitle=document.querySelector('.profile-title p');
  if(profileTitle&&document.getElementById('profileDisplayRole'))profileTitle.innerHTML='<span id="profileDisplayRole">'+document.getElementById('profileDisplayRole').textContent+'</span> - '+data.org;
  const orgInput=[...document.querySelectorAll('#settings input')].find(input=>input.value==='Meridian Real Estate'||input.value==='Downtown Campus'||input.value==='North Tower Group');
  if(orgInput)orgInput.value=data.org;
  localStorage.setItem('gridbalancePortfolioKey',key);
  if(notify)toast(data.label+' selected - '+data.detail)
}

function selectPortfolio(label,detail) {
  const key=portfolioKeyFromLabel(label);
  applyPortfolioSelection(key,true);
  closePortfolioMenu()
}

function initPortfolioSelection() {
  const saved=localStorage.getItem('gridbalancePortfolioKey')||portfolioKeyFromLabel(document.getElementById('portfolioLabel')?.textContent);
  applyPortfolioSelection(saved,false)
}

document.addEventListener('DOMContentLoaded',initPortfolioSelection)
const buildingFilterData= {

  all: {
    label:'All Buildings',subtitle:"Here's how all buildings are performing today.",kpis:['1.84 <span>MW</span>','18.6 <span>MWh</span>','7.4 <span>MWh</span>','$1,284','2.8 <span>tons</span>'],trends:['8.4% vs yesterday','6.2% vs yesterday','39.8% of total demand','11.7% this week','This month'],demand:'1.84 MW',risk:'High at 19:20',shift:'126 kW'
  },
  meridian: {
    label:'Meridian Tower',subtitle:'Meridian Tower performance is shown for today.',kpis:['1.42 <span>MW</span>','12.9 <span>MWh</span>','5.1 <span>MWh</span>','$894','1.9 <span>tons</span>'],trends:['5.1% vs yesterday','4.4% vs yesterday','41.2% of tower demand','8.2% this week','This month'],demand:'1.42 MW',risk:'Moderate at 18:50',shift:'92 kW'
  },
  downtown: {
    label:'Downtown Campus',subtitle:'Downtown Campus performance is shown for today.',kpis:['0.92 <span>MW</span>','8.4 <span>MWh</span>','2.8 <span>MWh</span>','$512','1.1 <span>tons</span>'],trends:['3.8% vs yesterday','2.9% vs yesterday','33.3% of campus demand','6.5% this week','This month'],demand:'0.92 MW',risk:'Low at 17:40',shift:'58 kW'
  },
  north: {
    label:'North Tower Group',subtitle:'North Tower Group performance is shown for today.',kpis:['1.21 <span>MW</span>','10.7 <span>MWh</span>','3.6 <span>MWh</span>','$687','1.5 <span>tons</span>'],trends:['6.7% vs yesterday','5.0% vs yesterday','36.8% of tower demand','9.1% this week','This month'],demand:'1.21 MW',risk:'High at 19:05',shift:'74 kW'
  }
};

let selectedBuildingKey='all';

function toggleBuildingMenu(event) {
  event.stopPropagation();
  closeProfileMenu();
  closePortfolioMenu();
  const menu=document.getElementById('buildingMenu');
  if(menu)menu.classList.toggle('show')
}

function closeBuildingMenu() {
  const menu=document.getElementById('buildingMenu');
  if(menu)menu.classList.remove('show')
}

function selectBuilding(key) {
  selectedBuildingKey=key;
  applyBuildingFilter(key);
  closeBuildingMenu();
  toast((buildingFilterData[key]||buildingFilterData.all).label+' selected')
}

function applyBuildingFilter(key) {
  const data=buildingFilterData[key]||buildingFilterData.all;
  const label=document.getElementById('buildingFilterLabel');
  const subtitle=document.getElementById('overviewSubtitle');
  if(label)label.textContent=data.label;
  if(subtitle)subtitle.textContent=data.subtitle;
  document.querySelectorAll('#buildingMenu button').forEach(btn=> {
    const selected=btn.textContent.includes(data.label);const marker=btn.querySelector('span:last-child');btn.classList.toggle('selected',selected);if(marker) {
      marker.classList.toggle('check',selected);marker.textContent=selected?'✓':''
    }
  });
  document.querySelectorAll('#overview .kpi').forEach((card,index)=> {
    const metric=card.querySelector('.metric');const trend=card.querySelector('.trend');if(metric&&data.kpis[index])metric.innerHTML=data.kpis[index];if(trend&&data.trends[index])trend.textContent=' '+data.trends[index]
  });
  const demand=document.getElementById('demandStatCurrent');
  const risk=document.getElementById('demandStatRisk');
  const shift=document.getElementById('demandStatShift');
  if(demand)demand.textContent=data.demand;
  if(risk)risk.textContent=data.risk;
  if(shift)shift.textContent=data.shift
}

function refreshDashboard() {
  const overview=document.getElementById('overview');
  const btn=document.getElementById('refreshBtn');
  if(!overview)return;
  overview.classList.add('refreshing');
  if(btn) {
    btn.disabled=true;
    btn.textContent='Refreshing...'
  }
  setTimeout(()=> {
    applyBuildingFilter(selectedBuildingKey);updateDemandChart('Today');overview.classList.remove('refreshing');if(btn) {
      btn.disabled=false;btn.textContent='Refresh'
    }
    toast('Dashboard refreshed with latest readings')
  },1500)
}

function openProfileDashboard() {
  go('profile');
  toast('Profile dashboard opened')
}

function toggleProfileEdit() {
  const editing=document.getElementById('profileNameInput').disabled;
  document.querySelectorAll('#profileNameInput,#profileRoleInput,#profileEmailInput,#profilePhoneInput').forEach(x=>x.disabled=!editing);
  document.getElementById('profileSaveBtn').disabled=!editing;
  document.getElementById('profileEditBtn').textContent=editing?'Cancel edit':'Edit profile';
  refreshEnhancedSelectStates();
  toast(editing?'Profile fields unlocked':'Profile editing cancelled')
}

function saveProfileDetails() {
  const name=document.getElementById('profileNameInput').value.trim()||'Moon';
  const role=document.getElementById('profileRoleInput').value;
  document.getElementById('profileDisplayName').textContent=name;
  document.getElementById('profileDisplayRole').textContent=role;
  document.getElementById('profileAvatarLarge').textContent=name.charAt(0).toUpperCase();
  document.querySelectorAll('.profile .avatar,.profile-card .avatar').forEach(x=>x.textContent=name.charAt(0).toUpperCase());
  document.querySelectorAll('.profile b[style],.profile-card b').forEach(x=> {
    if(x.textContent==='Moon'||x.textContent===name)x.textContent=name
  });
  document.querySelectorAll('.profile small,.profile-card small').forEach(x=> {
    if(x.textContent.includes('Facility Manager')||x.textContent.includes('Energy Analyst')||x.textContent.includes('Operations Admin'))x.textContent=role
  });
  document.querySelectorAll('#profileNameInput,#profileRoleInput,#profileEmailInput,#profilePhoneInput').forEach(x=>x.disabled=true);
  document.getElementById('profileSaveBtn').disabled=true;
  document.getElementById('profileEditBtn').textContent='Edit profile';
  refreshEnhancedSelectStates();
  toast('Profile details saved')
}

function togglePermission(btn,label) {
  btn.classList.toggle('on');
  toast(label+' '+(btn.classList.contains('on')?'enabled':'disabled'))
}

function completeApproval(btn) {
  const row=btn.closest('.approval-row');
  if(row) {
    row.style.opacity='.58';
    row.querySelectorAll('button').forEach(x=>x.disabled=true);
    btn.textContent='Done';
    btn.classList.add('done');
    const count=document.getElementById('profileApprovalCount');
    if(count)count.textContent='1 pending'
  }
  toast('Approval action completed')
}

function prepareProfileExport() {
  toast('Profile export prepared for Moon')
}

const reportMetricData= {

  'Monthly Energy Report': {
    energy:'18.6 MWh',peak:'1.84 MW',savings:'$1,284',note:'Portfolio energy, demand, cost, and optimization summary.'
  },
  'HVAC Performance Report': {
    energy:'5.8 MWh',peak:'642 kW',savings:'126 kW shifted',note:'Zone comfort, HVAC load, setpoint changes, and anomaly summary.'
  },
  'Solar Performance Report': {
    energy:'7.4 MWh',peak:'612 kW',savings:'1.2 MWh exported',note:'Solar production, utilization, export, and forecast variance summary.'
  },
  'Sustainability Report': {
    energy:'84.2 tons CO2',peak:'41.8% renewable',savings:'3,842 trees',note:'Carbon impact, renewable energy, and sustainability score summary.'
  }
};

function getReportSelection() {
  return {
    type:document.getElementById('reportType')?.value||'Monthly Energy Report',building:document.getElementById('reportBuilding')?.value||'All Buildings',range:document.getElementById('reportRange')?.value||'July 1 - July 31, 2026'
  }
}

function updateReportPreview() {
  const selection=getReportSelection();
  const data=reportMetricData[selection.type]||reportMetricData['Monthly Energy Report'];
  const title=document.getElementById('reportPreviewTitle');
  const sub=document.getElementById('reportPreviewSub');
  if(title)title.textContent=selection.type;
  if(sub)sub.textContent=selection.building+' - '+selection.range;
  const energy=document.getElementById('reportEnergy');
  const peak=document.getElementById('reportPeak');
  const savings=document.getElementById('reportSavings');
  if(energy)energy.textContent=data.energy;
  if(peak)peak.textContent=data.peak;
  if(savings)savings.textContent=data.savings;
  refreshEnhancedSelectStates()
}

function reportRows(selection) {
  const data=reportMetricData[selection.type]||reportMetricData['Monthly Energy Report'];
  return[['Report type',selection.type],['Building',selection.building],['Date range',selection.range],['Generated by','Moon - Facility Manager'],['Generated at',new Date().toLocaleString()],['Energy / Impact',data.energy],['Peak / Coverage',data.peak],['Savings / Result',data.savings],['Summary',data.note]]
}

function downloadCsvFile(filename,rows) {
  const csv=rows.map(row=>row.map(csvEscape).join(',')).join('\n');
  const blob=new Blob([csv], {
    type:'text/csv;charset=utf-8'
  });
  downloadBlob(filename,blob)
}

function escapePdfText(value) {
  return String(value).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')
}

function makeSimplePdf(title,rows) {
  const lines=[title,'GridBalance Report',''].concat(rows.map(row=>row[0]+': '+row[1]));
  let y=760;
  const text=lines.map((line,index)=> {
    const size=index===0?18:11;const leading=index===0?30:18;const command='BT /F1 '+size+' Tf 54 '+y+' Td ('+escapePdfText(line)+') Tj ET';y-=leading;return command
  }).join('\n');
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Length '+text.length+' >>\nstream\n'+text+'\nendstream'];
  let pdf='%PDF-1.4\n';
  const offsets=[0];
  objects.forEach((obj,index)=> {
    offsets[index+1]=pdf.length;pdf+=(index+1)+' 0 obj\n'+obj+'\nendobj\n'
  });
  const xref=pdf.length;
  pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
  for(let i=1;i<=objects.length;i++) {
    pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n'
  }
  pdf+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
  return new Blob([pdf], {
    type:'application/pdf'
  })
}

function downloadBlob(filename,blob) {
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download=filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500)
}

function slugReportName(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
}

function generateReport() {
  const selection=getReportSelection();
  const status=document.getElementById('reportStatus');
  if(status) {
    status.className='report-status show';
    status.textContent='Generating '+selection.type+'...'
  }
  setTimeout(()=> {
    const rows=reportRows(selection);const filename='gridbalance-'+slugReportName(selection.type)+'-'+slugReportName(selection.building)+'.pdf';downloadBlob(filename,makeSimplePdf(selection.type,rows));addRecentGeneratedReport(selection);if(status) {
      status.className='report-status show done';status.textContent=selection.type+' generated and downloaded.'
    }
    toast(selection.type+' downloaded')
  },650)
}

function addRecentGeneratedReport(selection) {
  const list=document.getElementById('recentReports');
  if(!list)return;
  const title=selection.type+' - '+selection.building;
  const existing=[...list.querySelectorAll('.recent-report-row span')].find(span=>span.textContent===title);
  if(existing)return;
  const row=document.createElement('div');
  row.className='recent-report-row';
  row.innerHTML='<span>'+title+'</span><div class="recent-report-actions"><button class="secondary" onclick="downloadRecentReport(\''+title.replace(/'/g,'\\\'')+'\',\'pdf\')">PDF</button><button class="secondary" onclick="downloadRecentReport(\''+title.replace(/'/g,'\\\'')+'\',\'csv\')">CSV</button></div>';
  list.prepend(row)
}

function downloadRecentReport(title,format) {
  const selection= {
    type:title,building:document.getElementById('portfolioLabel')?.textContent.replace('Portfolio: ','')||'All Buildings',range:'Archived report'
  };
  const rows=reportRows(selection);
  const base='gridbalance-'+slugReportName(title);
  if(format==='csv') {
    downloadCsvFile(base+'.csv',rows);
    toast(title+' CSV downloaded');
    return
  }
  downloadBlob(base+'.pdf',makeSimplePdf(title,rows));
  toast(title+' PDF downloaded')
}

function initReports() {
  updateReportPreview()
}

document.addEventListener('DOMContentLoaded',initReports)
function prepareManagerReport() {
  downloadRecentReport('Facility Manager Report','pdf')
}

function logout() {
  document.documentElement.classList.remove('session-restoring');
  sessionRemove(SESSION_AUTH_KEY);
  sessionRemove(SESSION_PAGE_KEY);
  closeProfileMenu();
  document.getElementById('app').style.display='none';
  document.getElementById('login').style.display='grid';
  document.querySelectorAll('.page-view').forEach(x=>x.classList.remove('active'));
  document.getElementById('overview').classList.add('active');
  document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.page==='overview'));
  toast('Logged out successfully')
}

document.addEventListener('click',event=> {
  closeProfileMenu();
  if(!event.target.closest('.portfolio-wrap'))closePortfolioMenu();
  if(!event.target.closest('.building-filter-wrap'))closeBuildingMenu();
  if(!event.target.closest('.search'))closeSearchResults();
  if(sidebar&&sidebar.classList.contains('open')&&!event.target.closest('#sidebar')&&!event.target.closest('.mobile-menu'))sidebar.classList.remove('open')
})
document.addEventListener('DOMContentLoaded',initNavigation)
function toast(message) {
  const el=document.getElementById('toast');
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),3200)
}

const demandChartData= {

  'Today': {
    actual:'M46 198 C75 194,86 192,110 187 S153 184,178 166 S220 124,247 119 S283 105,315 117 S344 91,376 103 S414 83,445 89 S477 70,510 78 S546 50,575 68 S617 97,647 126 S665 148,680 160',predicted:'M46 203 C120 190,175 159,247 134 S340 108,410 100 S525 78,575 80 S633 109,680 141',pulse:[575,68],current:'1.84 MW',trend:'+8.4% vs yesterday',risk:'High at 19:20',forecast:'+6.1% predicted',shift:'126 kW',title:'Optimization window ready',insight:'Shift HVAC load before 19:20 to avoid peak tariff pressure.'
  },
  'Yesterday': {
    actual:'M46 204 C92 196,124 190,160 178 S218 138,252 130 S318 124,354 111 S414 98,452 104 S506 88,548 94 S612 118,680 151',predicted:'M46 206 C120 194,186 164,252 138 S340 120,430 106 S562 98,680 144',pulse:[548,94],current:'1.71 MW',trend:'-4.2% vs today',risk:'Moderate at 18:40',forecast:'+3.4% predicted',shift:'92 kW',title:'Yesterday baseline loaded',insight:'Peak stayed below grid capacity after scheduled HVAC drift.'
  },
  'This Week': {
    actual:'M46 182 C96 172,140 160,190 144 S268 102,330 116 S430 88,498 80 S578 64,630 92 S662 116,680 132',predicted:'M46 190 C136 162,224 130,318 110 S450 92,560 78 S635 102,680 124',pulse:[578,64],current:'12.8 MW avg',trend:'+5.9% weekly',risk:'Peak cluster',forecast:'+7.2% predicted',shift:'410 kW',title:'Weekly peak pattern detected',insight:'The highest loads are clustering between 17:00 and 20:00.'
  },
  'This Month': {
    actual:'M46 192 C118 178,178 158,235 148 S322 126,390 112 S474 94,535 80 S612 84,650 110 S680 128',predicted:'M46 196 C130 174,220 150,310 128 S438 104,548 90 S632 98,680 118',pulse:[535,80],current:'386 MWh',trend:'+3.1% monthly',risk:'Stable trend',forecast:'+2.8% forecast',shift:'1.8 MWh',title:'Monthly demand is stable',insight:'Load-balancing opportunities are strongest on weekday evenings.'
  }
};

function period(el,name) {
  el.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('sel'));
  el.classList.add('sel');
  updateDemandChart(name);
  toast('Demand chart updated: '+name)
}

function updateDemandChart(name) {
  const data=demandChartData[name]||demandChartData.Today;
  const actual=document.getElementById('actualDemandLine');
  const glow=document.getElementById('actualDemandGlow');
  const predicted=document.getElementById('predictedDemandLine');
  const area=document.getElementById('demandArea');
  const pulse=document.getElementById('demandPulse');
  const halo=document.getElementById('demandHalo');
  const chart=document.getElementById('demandChart');
  if(!actual||!predicted||!area)return;
  actual.setAttribute('d',data.actual);
  if(glow)glow.setAttribute('d',data.actual);
  predicted.setAttribute('d',data.predicted);
  area.setAttribute('d',data.actual+' L680 232 L46 232Z');
  if(pulse) {
    pulse.setAttribute('cx',data.pulse[0]);
    pulse.setAttribute('cy',data.pulse[1])
  }
  if(halo) {
    halo.setAttribute('cx',data.pulse[0]);
    halo.setAttribute('cy',data.pulse[1])
  }
  const fields= {
    demandStatCurrent:data.current,demandStatTrend:data.trend,demandStatRisk:data.risk,demandStatForecast:data.forecast,demandStatShift:data.shift,demandInsightTitle:data.title,demandInsightText:data.insight
  };
  Object.keys(fields).forEach(id=> {
    const el=document.getElementById(id);if(el)el.textContent=fields[id]
  });
  [area,actual,glow,predicted,pulse,halo].filter(Boolean).forEach(node=> {
    node.style.animation='none';void node.getBoundingClientRect();node.style.animation=''
  });
  if(chart) {
    chart.classList.remove('demand-motion');
    void chart.offsetWidth;
    chart.classList.add('demand-motion')
  }
}

function chartTip(e,svg) {
  const t=document.getElementById('tooltip');
  t.innerHTML='<b>3:00 PM</b><br>Current Load: 1.84 MW<br>Solar: 612 kW  HVAC: 642 kW';
  showTooltip(e,t)
}

function solarTip(e) {
  const t=document.getElementById('tooltip');
  const rect=e.currentTarget.getBoundingClientRect();
  const x=e.clientX-(rect.left+rect.width/2);
  const y=e.clientY-(rect.top+rect.height/2);
  const distance=Math.sqrt(x*x+y*y);
  const inner=rect.width*.31;
  if(distance<inner) {
    t.innerHTML='<b>Solar coverage</b><br><span style="color:#fef3c7">39.8%</span> of building demand';
    showTooltip(e,t);
    return
  }
  let angle=Math.atan2(y,x)*180/Math.PI+90;
  if(angle<0)angle+=360;
  const usedEnd=37.4*3.6;
  const exportEnd=43.5*3.6;
  if(angle<=usedEnd) {
    t.innerHTML='<b>Solar used</b><br><span style="color:#fbbf24">7.4 MWh</span><br>Consumed by building loads'
  } else if(angle<=exportEnd) {
    t.innerHTML='<b>Solar exported</b><br><span style="color:#86efac">1.2 MWh</span><br>Sent back to grid / battery'
  } else {
    t.innerHTML='<b>Grid imported</b><br><span style="color:#93c5fd">11.2 MWh</span><br>Imported from utility grid'
  }
  showTooltip(e,t)
}

function showTooltip(e,t) {
  t.style.display='block';
  t.style.left=(e.clientX+15)+'px';
  t.style.top=(e.clientY-20)+'px'
}
function hideTip() {
  document.getElementById('tooltip').style.display='none'
}

function resetModalAction() {
  const modal=document.getElementById('modal');
  modal.querySelector('h2').textContent='Apply peak-demand optimization?';
  modal.querySelector('p').innerHTML='GridBalance will schedule an 8% HVAC reduction in low-occupancy zones at 4:30 PM. Estimated reduction: <b>126 kW</b>; estimated savings: <b></b>.';
  const confirm=modal.querySelector('.primary');
  confirm.textContent='Confirm & apply';
  confirm.onclick=applyRecommendation
}
function openModal() {
  resetModalAction();
  document.getElementById('modal').classList.add('show')
}
function closeModal() {
  document.getElementById('modal').classList.remove('show');
  setTimeout(resetModalAction,160)
}
function applyRecommendation() {
  closeModal();
  toast('Optimization Applied  HVAC load reduction scheduled for 4:30 PM.')
}

function getSetpointValue() {
  const input=document.getElementById('setpoint');
  const value=Number(input?input.value:NaN);
  if(!Number.isFinite(value))return null;
  return Math.round(value*2)/2
}

function formatSetpoint(value) {
  return Number(value).toFixed(1)
}

function previewSetpointDraft() {
  const value=getSetpointValue();
  const status=document.getElementById('setpointStatus');
  if(!status)return;
  if(value===null) {
    status.className='setpoint-status';
    status.textContent='Enter a valid temperature between 18C and 28C.';
    return
  }
  if(value<18||value>28) {
    status.className='setpoint-status';
    status.textContent='Allowed range is 18C to 28C for tenant comfort safety.';
    return
  }
  status.className='setpoint-status';
  status.textContent='Ready to request '+formatSetpoint(value)+'C for low-occupancy zones.'
}

function adjustSetpointDraft(delta) {
  const input=document.getElementById('setpoint');
  if(!input)return;
  const current=getSetpointValue()??23;
  const next=Math.min(28,Math.max(18,Math.round((current+delta)*2)/2));
  input.value=formatSetpoint(next);
  previewSetpointDraft()
}

function openSetpoint() {
  const value=getSetpointValue();
  if(value===null||value<18||value>28) {
    previewSetpointDraft();
    toast('Setpoint must be between 18C and 28C');
    return
  }
  const modal=document.getElementById('modal');
  modal.querySelector('h2').textContent='Confirm HVAC setpoint change';
  modal.querySelector('p').innerHTML='Apply <b>'+formatSetpoint(value)+'C</b> to low-occupancy zones: South Wing, Conference, and Lobby. This will update the live HVAC setpoint after confirmation.';
  const confirm=modal.querySelector('.primary');
  confirm.textContent='Confirm change';
  confirm.onclick=applySetpointChange;
  modal.classList.add('show')
}

function applySetpointChange() {
  const value=getSetpointValue();
  if(value===null||value<18||value>28) {
    closeModal();
    previewSetpointDraft();
    toast('Setpoint request cancelled: invalid range');
    return
  }
  const display=document.getElementById('currentSetpointMetric');
  const applied=document.getElementById('setpointAppliedText');
  const status=document.getElementById('setpointStatus');
  if(display)display.innerHTML=formatSetpoint(value)+' <span>C</span>';
  if(applied)applied.textContent='Applied to low-occupancy zones';
  if(status) {
    status.className='setpoint-status approved';
    status.textContent='Approved now - South Wing, Conference, and Lobby updated to '+formatSetpoint(value)+'C.'
  }
  document.querySelectorAll('#hvac .floor').forEach(floor=> {
    const label=floor.querySelector('small');if(!label)return;const name=label.textContent.split(/\s{2,}/)[0].trim();if(['South Wing','Conference','Lobby'].includes(name)) {
      label.textContent=name+'  '+formatSetpoint(value)+'C';floor.classList.remove('setpoint-updated');void floor.offsetWidth;floor.classList.add('setpoint-updated')
    }
  });
  localStorage.setItem('gridbalanceSetpoint',String(value));
  closeModal();
  toast('HVAC setpoint updated to '+formatSetpoint(value)+'C')
}

function restoreSetpoint() {
  const stored=Number(localStorage.getItem('gridbalanceSetpoint'));
  if(!Number.isFinite(stored))return;
  const input=document.getElementById('setpoint');
  if(input)input.value=formatSetpoint(stored);
  const display=document.getElementById('currentSetpointMetric');
  if(display)display.innerHTML=formatSetpoint(stored)+' <span>C</span>';
  document.querySelectorAll('#hvac .floor').forEach(floor=> {
    const label=floor.querySelector('small');if(!label)return;const name=label.textContent.split(/\s{2,}/)[0].trim();if(['South Wing','Conference','Lobby'].includes(name))label.textContent=name+'  '+formatSetpoint(stored)+'C'
  });
  previewSetpointDraft()
}

const defaultAlertsState=[ {
  id:'peak-demand',severity:'High',color:'#dc2626',title:'Peak demand approaching',description:'Meridian Tower demand is currently at 91% of the configured peak threshold.',building:'Meridian Tower',time:'8 minutes ago',status:'open'
}, {
  id:'hvac-anomaly',severity:'Medium',color:'#f97316',title:'HVAC anomaly detected',description:'East Wing HVAC consumption is 18% above expected levels.',building:'Meridian Tower',time:'24 minutes ago',status:'open'
}, {
  id:'solar-forecast',severity:'Medium',color:'#f59e0b',title:'Solar output below forecast',description:'Solar generation is 9% lower than todays forecast.',building:'Lakeside Business Center',time:'1 hour ago',status:'open'
}, {
  id:'optimization-complete',severity:'Resolved',color:'#16a34a',title:'Optimization completed',description:'HVAC load reduced by 126 kW during peak period.',building:'Meridian Tower',time:'1 hour ago',status:'resolved'
}

];

let alertsState=loadAlertsState();
let currentAlertFilter='open';

function loadAlertsState() {
  try {
    const saved=localStorage.getItem('gridbalanceAlertsState');
    if(saved) {
      const parsed=JSON.parse(saved);
      if(Array.isArray(parsed)&&parsed.length)return parsed
    }
  } catch(error) {
  }
  return defaultAlertsState.map(alert=>( {
    ...alert
  }))
}

function saveAlertsState() {
  localStorage.setItem('gridbalanceAlertsState',JSON.stringify(alertsState))
}

function openAlertCount() {
  return alertsState.filter(alert=>alert.status!=='resolved').length
}

function syncAlertCounters() {
  const count=openAlertCount();
  ['alertCount','topAlertBadge','profileOpenAlerts'].forEach(id=> {
    const el=document.getElementById(id);if(el) {
      el.textContent=String(count);el.style.display=count>0?'':'none'
    }
  });
  const summary=document.getElementById('alertsSummary');
  if(summary)summary.textContent=count+' open alert'+(count===1?'':'s')
}

function setAlertFilter(filter,button) {
  currentAlertFilter=filter;
  document.querySelectorAll('[data-alert-filter]').forEach(btn=>btn.classList.toggle('sel',btn===button||btn.dataset.alertFilter===filter));
  renderAlerts()
}

function filteredAlerts() {
  if(currentAlertFilter==='resolved')return alertsState.filter(alert=>alert.status==='resolved');
  if(currentAlertFilter==='open')return alertsState.filter(alert=>alert.status!=='resolved');
  return alertsState
}

function renderAlerts() {
  const list=document.getElementById('allAlerts');
  const empty=document.getElementById('alertsEmpty');
  if(!list)return;
  const rows=filteredAlerts();
  list.innerHTML=rows.map(alert=>'<div class="alert-row '+(alert.status==='resolved'?'resolved':'')+'" data-alert-id="'+alert.id+'"><i class="alert-dot" style="background:'+alert.color+'"></i><div><b>'+escapeAutomationHtml(alert.title)+'</b><p>'+escapeAutomationHtml(alert.description)+'</p><small>'+escapeAutomationHtml(alert.building)+' '+escapeAutomationHtml(alert.time)+'</small></div><div class="alert-actions"><button class="secondary" type="button" onclick="openAlertDetails(\''+alert.id+'\')">Details</button>'+(alert.status==='resolved'?'<span class="status">Resolved</span>':'<button class="secondary resolve" type="button" onclick="resolveAlert(\''+alert.id+'\')">Resolve</button>')+'</div></div>').join('');
  if(empty)empty.classList.toggle('show',rows.length===0);
  syncAlertCounters()
}

function resolveAlert(id) {
  const alert=alertsState.find(item=>item.id===id);
  if(!alert||alert.status==='resolved')return;
  alert.status='resolved';
  alert.severity='Resolved';
  alert.color='#16a34a';
  saveAlertsState();
  renderAlerts();
  toast(alert.title+' resolved')
}

function resolveAll() {
  let changed=0;
  alertsState.forEach(alert=> {
    if(alert.status!=='resolved') {
      alert.status='resolved';alert.severity='Resolved';alert.color='#16a34a';changed++
    }
  });
  saveAlertsState();
  renderAlerts();
  toast(changed?changed+' alerts marked as resolved':'All alerts are already resolved')
}

function openAlertDetails(id) {
  const alert=alertsState.find(item=>item.id===id);
  if(!alert)return;
  document.getElementById('alertDetailTitle').textContent=alert.title;
  document.getElementById('alertDetailSub').textContent=alert.building+' alert';
  document.getElementById('alertDetailDescription').textContent=alert.description;
  document.getElementById('alertDetailBuilding').textContent=alert.building;
  document.getElementById('alertDetailStatus').textContent=alert.status==='resolved'?'Resolved':'Open';
  document.getElementById('alertDetailSeverity').textContent=alert.severity;
  document.getElementById('alertDetailTime').textContent=alert.time;
  const btn=document.getElementById('alertDetailResolveBtn');
  if(btn) {
    btn.disabled=alert.status==='resolved';
    btn.textContent=alert.status==='resolved'?'Already resolved':'Resolve alert';
    btn.onclick=()=> {
      resolveAlert(id);
      closeAlertDetails()
    }
  }
  const modal=document.getElementById('alertDetailModal');
  if(modal)modal.classList.add('show');
  document.body.classList.add('automation-modal-open')
}

function closeAlertDetails() {
  const modal=document.getElementById('alertDetailModal');
  if(modal)modal.classList.remove('show');
  document.body.classList.remove('automation-modal-open')
}

function exportAlertsLog() {
  const rows=[['title','building','severity','status','detected','description']].concat(alertsState.map(alert=>[alert.title,alert.building,alert.severity,alert.status,alert.time,alert.description]));
  const csv=rows.map(row=>row.map(csvEscape).join(',')).join('\n');
  downloadBlob('gridbalance-alert-log.csv',new Blob([csv], {
    type:'text/csv;charset=utf-8'
  }));
  toast('Alert log exported')
}

function initAlerts() {
  renderAlerts()
}

document.addEventListener('DOMContentLoaded',initAlerts)
const searchIndex=[ {
  title:'Overview',detail:'Live KPIs, current load, solar share, HVAC demand',page:'overview',terms:'home dashboard kpi load generation efficiency'
}, {
  title:'Meridian Tower',detail:'Building profile, floors, city portfolio, energy use',page:'buildings',terms:'building buildings meridian tower property'
}, {
  title:'Energy Analytics',detail:'Demand charts, consumption trends, performance analysis',page:'analytics',terms:'analytics chart demand consumption trend'
}, {
  title:'HVAC Control',detail:'Temperature, zones, air handling units and setpoints',page:'hvac',terms:'hvac cooling heating temperature zone setpoint'
}, {
  title:'Solar Generation',detail:'Solar output, panels, battery contribution and production',page:'solar',terms:'solar panel generation battery renewable'
}, {
  title:'Load Balancer',detail:'Peak-demand shift, grid tie, battery buffer and optimization',page:'balancer',terms:'load balancer optimize grid peak demand battery'
}, {
  title:'Automation Rules',detail:'Auto power-saving actions and scheduling rules',page:'automation',terms:'automation rules schedule power saving'
}, {
  title:'Alerts',detail:'Open warnings, anomalies and system notifications',page:'alerts',terms:'alert alerts notification warning anomaly'
}, {
  title:'Sustainability',detail:'CO2 reduction, green score and energy impact',page:'sustainability',terms:'sustainability carbon co2 green emissions'
}, {
  title:'Reports',detail:'Export energy, HVAC and sustainability reports',page:'reports',terms:'reports report export pdf csv'
}, {
  title:'Settings',detail:'Organization, tariff, thresholds and notification settings',page:'settings',terms:'settings account configuration tariff threshold'
}, {
  title:'Facility Manager Profile',detail:'Moon profile, access level and manager actions',page:'profile',terms:'profile moon facility manager account'
}

];

function search(q) {
  const panel=document.getElementById('searchResults');
  if(!panel)return;
  const term=(q||'').trim().toLowerCase();
  if(term.length<2) {
    panel.classList.remove('show');
    panel.innerHTML='';
    return
  }
  const matches=searchIndex.filter(item=>(item.title+' '+item.detail+' '+item.terms).toLowerCase().includes(term)).slice(0,7);
  if(!matches.length) {
    panel.innerHTML='<div class="search-empty">No results found</div>';
    panel.classList.add('show');
    return
  }
  panel.innerHTML=matches.map(item=>'<button class="search-result" type="button" data-page="'+item.page+'" data-title="'+item.title+'"><span class="ico"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"></circle><path d="M16 16l4 4"></path></svg></span><span><b>'+item.title+'</b><small>'+item.detail+'</small></span></button>').join('');
  panel.querySelectorAll('button[data-page]').forEach(btn=>btn.addEventListener('click',()=>selectSearchResult(btn.dataset.page,btn.dataset.title)));
  panel.classList.add('show')
}

function selectSearchResult(page,title) {
  const input=document.getElementById('globalSearch');
  const panel=document.getElementById('searchResults');
  if(input)input.value='';
  if(panel) {
    panel.classList.remove('show');
    panel.innerHTML=''
  }
  go(page);
  toast(title+' opened')
}

function closeSearchResults() {
  const panel=document.getElementById('searchResults');
  if(panel)panel.classList.remove('show')
}

const analyticsBase= {

  buildings: {
    'Meridian Tower': {
      scale:1,intensity:128,peakScale:1,savings:320
    },'Downtown Campus': {
      scale:.72,intensity:116,peakScale:.78,savings:214
    },'North Tower Group': {
      scale:.86,intensity:134,peakScale:.9,savings:248
    },'All Buildings': {
      scale:1.38,intensity:124,peakScale:1.32,savings:782
    }
  },
  ranges: {
    'Today': {
      scale:.32,label:'Hourly readings for today'
    },'Last 7 days': {
      scale:.62,label:'Daily readings for the last 7 days'
    },'Last 30 days': {
      scale:1,label:'Daily readings for the last 30 days'
    },'This quarter': {
      scale:2.35,label:'Weekly readings for this quarter'
    }
  },
  sources: {
    'All energy sources': {
      scale:1,color:'#2563eb',label:'whole-building demand'
    },'Grid import': {
      scale:.64,color:'#0ea5e9',label:'grid import'
    },'Solar generation': {
      scale:.39,color:'#f59e0b',label:'solar generation'
    },'HVAC load': {
      scale:.46,color:'#16a34a',label:'HVAC demand'
    }
  },
  floors: {
    'All floors': {
      scale:1,label:'all floors'
    },'Lobby': {
      scale:.18,label:'lobby zone'
    },'Floor 5-7': {
      scale:.42,label:'floors 5-7'
    },'Floor 8-10': {
      scale:.52,label:'floors 8-10'
    },'Rooftop solar': {
      scale:.31,label:'rooftop solar zone'
    }
  },
  consumption:[11.8,12.4,11.9,14.6,13.5,16.8,15.7,18.1,16.9,19.4],
  previous:[10.9,11.3,11.8,13.1,12.9,15.2,14.8,16.4,15.9,17.2],
  peaks:[1.58,1.82,1.69,1.94,1.72,2.08,1.91,2.01,1.78,2.15],
  labels:['D1','D4','D7','D10','D13','D16','D19','D22','D26','D30']
};

let analyticsTooltipData= {
  consumption:[],peak:[]
};

let analyticsLastExport=[];

function initAnalytics() {
  if(!document.getElementById('analyticsBuilding'))return;
  updateAnalytics(false)
}

function getAnalyticsFilters() {
  return {
    building:document.getElementById('analyticsBuilding').value,range:document.getElementById('analyticsRange').value,source:document.getElementById('analyticsSource').value,floor:document.getElementById('analyticsFloor').value
  }
}

function analyticsMultiplier(filters) {
  const building=analyticsBase.buildings[filters.building]||analyticsBase.buildings['Meridian Tower'];
  const range=analyticsBase.ranges[filters.range]||analyticsBase.ranges['Last 30 days'];
  const source=analyticsBase.sources[filters.source]||analyticsBase.sources['All energy sources'];
  const floor=analyticsBase.floors[filters.floor]||analyticsBase.floors['All floors'];
  return {
    total:building.scale*range.scale*source.scale*floor.scale,building,range,source,floor
  }
}

function updateAnalytics(showToast=true) {
  const filters=getAnalyticsFilters();
  const meta=analyticsMultiplier(filters);
  const consumption=analyticsBase.consumption.map(v=>roundMetric(v*meta.total));
  const previous=analyticsBase.previous.map(v=>roundMetric(v*meta.total*.94));
  const peaks=analyticsBase.peaks.map(v=>roundMetric(v*meta.building.peakScale*(meta.source.scale>.5?meta.source.scale:.68)*(meta.floor.scale>.6?meta.floor.scale:.74)));
  const intensity=Math.max(24,Math.round(meta.building.intensity*(.82+meta.source.scale*.22)*(meta.floor.scale>.6?1:meta.floor.scale+0.55)));
  const total=roundMetric(consumption.reduce((a,b)=>a+b,0));
  const maxPeak=Math.max(...peaks);
  const savings=Math.max(28,Math.round(meta.building.savings*meta.source.scale*(meta.floor.scale>.5?meta.floor.scale:.62)));
  document.getElementById('analyticsSubtitle').textContent=filters.building+' analytics for '+meta.source.label+' across '+meta.floor.label+'.';
  document.getElementById('analyticsConsumptionSub').textContent=meta.range.label+' - MWh';
  document.getElementById('analyticsPeakSub').textContent='MW demand threshold tracking - '+filters.range;
  document.getElementById('analyticsTotal').textContent=total+' MWh';
  document.getElementById('analyticsTotalTrend').textContent=(meta.total>=1?'+':'-')+Math.abs(roundMetric((meta.total-0.91)*8.6))+'% vs previous period';
  document.getElementById('analyticsPeak').textContent=maxPeak.toFixed(2)+' MW';
  document.getElementById('analyticsPeakTime').textContent='Peak risk near 19:20';
  document.getElementById('analyticsSavings').textContent=savings+' kWh/day';
  document.getElementById('analyticsIntensity').innerHTML=intensity+' <span>kWh/m2</span>';
  document.getElementById('analyticsIntensityTrend').textContent=(intensity>120?'+':'-')+Math.abs(Math.round((intensity-118)/3.2))+'% compared with previous month';
  document.getElementById('analyticsInsightText').innerHTML=buildAnalyticsInsight(filters,savings,intensity);
  renderAnalyticsLineChart('analyticsConsumptionChart', {
    type:'consumption',values:consumption,compare:previous,color:meta.source.color,unit:'MWh',labels:analyticsBase.labels
  });
  renderAnalyticsLineChart('analyticsPeakChart', {
    type:'peak',values:peaks,threshold:roundMetric(2.2*meta.building.peakScale),color:'#f97316',unit:'MW',labels:analyticsBase.labels
  });
  renderIntensityBars(intensity,meta.source.color);
  analyticsLastExport=analyticsBase.labels.map((label,index)=>( {
    period:label,building:filters.building,range:filters.range,source:filters.source,floor:filters.floor,consumption:consumption[index],previous:previous[index],peak:peaks[index],intensity
  }));
  if(showToast)toast('Analytics updated for '+filters.building)
}

function buildAnalyticsInsight(filters,savings,intensity) {
  const source=filters.source==='All energy sources'?'overall load':filters.source.toLowerCase();
  const level=intensity>130?'high':intensity>115?'moderate':'healthy';
  return source+' is showing a <b>'+level+'</b> intensity pattern for '+filters.floor+'. Shifting flexible HVAC and lighting schedules could reduce approximately <strong>'+savings+' kWh/day</strong> while keeping tenant comfort stable.'
}

function roundMetric(value) {
  return Math.round(value*10)/10
}

function analyticsPoints(values,width,height,pad,min,max) {
  return values.map((value,index)=> {
    const x=pad+(index*(width-pad*2)/(values.length-1));const y=height-pad-((value-min)/(max-min||1))*(height-pad*2);return {
      x,y,value
    }
  })
}

function renderAnalyticsLineChart(targetId,config) {
  const el=document.getElementById(targetId);
  if(!el)return;
  const width=620,height=220,pad=28;
  const all=config.compare?config.values.concat(config.compare):config.values.slice();
  if(config.threshold)all.push(config.threshold);
  const min=Math.max(0,Math.min(...all)*.82);
  const max=Math.max(...all)*1.12;
  const points=analyticsPoints(config.values,width,height,pad,min,max);
  const compare=config.compare?analyticsPoints(config.compare,width,height,pad,min,max):[];
  const path=points.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
  const comparePath=compare.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
  const area='M '+points[0].x.toFixed(1)+' '+(height-pad)+' L '+points.map(p=>p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' L ')+' L '+points[points.length-1].x.toFixed(1)+' '+(height-pad)+' Z';
  const grid=[0,1,2,3].map(i=> {
    const y=pad+i*(height-pad*2)/3;const label=roundMetric(max-(i*(max-min)/3));return'<line class="analytics-gridline" x1="'+pad+'" y1="'+y+'" x2="'+(width-pad)+'" y2="'+y+'"></line><text class="analytics-axis-label" x="2" y="'+(y+4)+'">'+label+'</text>'
  }).join('');
  let threshold='';
  if(config.threshold) {
    const ty=height-pad-((config.threshold-min)/(max-min||1))*(height-pad*2);
    threshold='<line class="capacity-line" x1="'+pad+'" y1="'+ty+'" x2="'+(width-pad)+'" y2="'+ty+'" stroke="#dc2626" stroke-width="2"></line><text class="analytics-axis-label" x="'+(width-pad-74)+'" y="'+(ty-8)+'">threshold</text>'
  }
  analyticsTooltipData[config.type]=points.map((point,index)=>( {
    label:config.labels[index],value:point.value+' '+config.unit,detail:config.type==='peak'?'Demand peak reading':'Energy consumption'
  }));
  const dots=points.map((p,index)=>'<circle class="analytics-hit" cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="15" onmousemove="showAnalyticsPoint(event,\''+config.type+'\','+index+')" onmouseleave="hideAnalyticsPoint()"></circle><circle class="analytics-point" cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="4.5" fill="'+config.color+'"></circle>').join('');
  const xLabels=[0,3,6,9].map(i=>'<text class="analytics-axis-label" x="'+points[i].x.toFixed(1)+'" y="'+(height-4)+'" text-anchor="middle">'+config.labels[i]+'</text>').join('');
  const previous=config.compare?'<path class="analytics-line previous" d="'+comparePath+'" stroke="#93c5fd"></path>':'';
  el.innerHTML='<svg class="analytics-svg" viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none"><defs><linearGradient id="area-'+config.type+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+config.color+'" stop-opacity=".22"></stop><stop offset="1" stop-color="'+config.color+'" stop-opacity=".02"></stop></linearGradient></defs>'+grid+'<path class="analytics-area" d="'+area+'" fill="url(#area-'+config.type+')"></path>'+threshold+previous+'<path class="analytics-line" d="'+path+'" stroke="'+config.color+'"></path>'+dots+xLabels+'</svg>'
}

function renderIntensityBars(intensity,color) {
  const labels=['Lobby','F5','F6','F7','F8','F9','F10'];
  const values=[.72,.88,.81,1.02,.94,1.12,.98].map(v=>Math.round(intensity*v));
  const max=Math.max(...values);
  document.getElementById('analyticsIntensityChart').innerHTML=values.map((value,index)=>'<div class="bar-item '+(value<120?'best':'')+'" title="'+labels[index]+': '+value+' kWh/m2"><div class="bar-fill" style="height:'+Math.max(24,Math.round(value/max*118))+'px;background:linear-gradient(180deg,'+color+',#93c5fd)"></div><small>'+labels[index]+'</small></div>').join('')
}

function showAnalyticsPoint(event,type,index) {
  const tip=document.getElementById('analyticsTooltip');
  const item=analyticsTooltipData[type]&&analyticsTooltipData[type][index];
  if(!tip||!item)return;
  const card=event.currentTarget.closest('.analytics-card');
  if(card&&tip.parentElement!==card)card.appendChild(tip);
  const rect=card.getBoundingClientRect();
  const left=Math.min(rect.width-150,Math.max(10,event.clientX-rect.left+12));
  const top=Math.max(12,event.clientY-rect.top-60);
  tip.style.left=left+'px';
  tip.style.top=top+'px';
  tip.innerHTML='<b>'+item.label+'</b><span>'+item.value+'</span><small style="display:block;color:#cbd5e1;margin-top:2px">'+item.detail+'</small>';
  tip.classList.add('show')
}

function hideAnalyticsPoint() {
  const tip=document.getElementById('analyticsTooltip');
  if(tip)tip.classList.remove('show')
}

function exportAnalyticsData() {
  if(!analyticsLastExport.length)updateAnalytics(false);
  const filters=getAnalyticsFilters();
  const rows=[['period','building','range','source','floor','consumption_mwh','previous_mwh','peak_mw','intensity_kwh_m2']].concat(analyticsLastExport.map(row=>[row.period,row.building,row.range,row.source,row.floor,row.consumption,row.previous,row.peak,row.intensity]));
  const csv=rows.map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob([csv], {
    type:'text/csv;charset=utf-8;'
  });
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download='gridbalance-analytics-'+filters.building.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500);
  toast('Analytics CSV exported for '+filters.building)
}

document.addEventListener('DOMContentLoaded',initAnalytics);

function toggleAnalyticsDropdown(event,menuId) {
  event.stopPropagation();
  document.querySelectorAll('.analytics-menu.show').forEach(menu=> {
    if(menu.id!==menuId)menu.classList.remove('show')
  });
  document.querySelectorAll('.analytics-trigger[aria-expanded="true"]').forEach(btn=>btn.setAttribute('aria-expanded','false'));
  const menu=document.getElementById(menuId);
  const trigger=event.currentTarget;
  if(!menu)return;
  const opening=!menu.classList.contains('show');
  menu.classList.toggle('show',opening);
  if(trigger)trigger.setAttribute('aria-expanded',opening?'true':'false')
}

function closeAnalyticsDropdowns() {
  document.querySelectorAll('.analytics-menu.show').forEach(menu=>menu.classList.remove('show'));
  document.querySelectorAll('.analytics-trigger[aria-expanded="true"]').forEach(btn=>btn.setAttribute('aria-expanded','false'))
}

function selectAnalyticsOption(filterId,value,button) {
  const input=document.getElementById(filterId);
  const label=document.getElementById(filterId+'Label');
  if(input)input.value=value;
  if(label)label.textContent=value;
  const menu=button?button.closest('.analytics-menu'):null;
  if(menu) {
    menu.querySelectorAll('button').forEach(item=> {
      item.classList.remove('selected');const mark=item.querySelector('em');if(mark)mark.textContent=''
    });
    button.classList.add('selected');
    const mark=button.querySelector('em');
    if(mark)mark.textContent='✓'
  }
  closeAnalyticsDropdowns();
  updateAnalytics(true)
}

document.addEventListener('click',closeAnalyticsDropdowns);

const enhancedSelectDetails= {

  'All buildings':'Show every property in the portfolio','All efficiency levels':'Include excellent, good, and warning states','All statuses':'Active, warning, and optimized buildings','Energy consumption':'Sort by highest consumption',
  'Monthly Energy Report':'Full monthly usage and cost summary','HVAC Performance Report':'Zone efficiency and comfort performance','Solar Performance Report':'Generation, export, and utilization','Sustainability Report':'CO2, savings, and renewable progress','All Buildings':'Portfolio-wide report scope','Meridian Tower':'Single building report scope','July 1 - July 31, 2026':'Current monthly reporting window',
  'Facility Manager':'Operational controls and approvals','Energy Analyst':'Analytics and reporting access','Operations Admin':'User and system administration'
};

function enhanceSelectDropdowns() {
  document.querySelectorAll('select:not([data-enhanced])').forEach((select,index)=> {
    select.dataset.enhanced='true';select.classList.add('native-select-hidden');if(!select.id)select.id='enhancedNativeSelect'+index;const wrap=document.createElement('div');wrap.className='enhanced-select';wrap.dataset.selectId=select.id;const trigger=document.createElement('button');trigger.type='button';trigger.className='enhanced-select-trigger';trigger.setAttribute('aria-expanded','false');trigger.innerHTML='<span>'+select.options[select.selectedIndex].text+'</span>';const menu=document.createElement('div');menu.className='enhanced-select-menu';Array.from(select.options).forEach((option,optionIndex)=> {
      const item=document.createElement('button');item.type='button';item.innerHTML='<span><b>'+option.text+'</b>'+(enhancedSelectDetails[option.text]?'<small>'+enhancedSelectDetails[option.text]+'</small>':'')+'</span><em>'+(optionIndex===select.selectedIndex?'✓':'')+'</em>';if(optionIndex===select.selectedIndex)item.classList.add('selected');item.addEventListener('click',event=> {
        event.stopPropagation();select.selectedIndex=optionIndex;select.dispatchEvent(new Event('change', {
          bubbles:true
        }));syncEnhancedSelect(select);closeEnhancedSelects();toast(option.text+' selected')
      });menu.appendChild(item)
    });trigger.addEventListener('click',event=> {
      event.stopPropagation();if(select.disabled)return;closeEnhancedSelects(wrap);wrap.classList.toggle('open');trigger.setAttribute('aria-expanded',wrap.classList.contains('open')?'true':'false')
    });wrap.appendChild(trigger);wrap.appendChild(menu);select.insertAdjacentElement('afterend',wrap);syncEnhancedSelect(select)
  });
  refreshEnhancedSelectStates()
}

function syncEnhancedSelect(select) {
  const wrap=document.querySelector('.enhanced-select[data-select-id="'+select.id+'"]');
  if(!wrap)return;
  const trigger=wrap.querySelector('.enhanced-select-trigger span');
  const items=wrap.querySelectorAll('.enhanced-select-menu button');
  if(trigger)trigger.textContent=select.options[select.selectedIndex]?select.options[select.selectedIndex].text:'';
  items.forEach((item,index)=> {
    item.classList.toggle('selected',index===select.selectedIndex);const mark=item.querySelector('em');if(mark)mark.textContent=index===select.selectedIndex?'✓':''
  });
  wrap.classList.toggle('disabled',select.disabled);
  const btn=wrap.querySelector('.enhanced-select-trigger');
  if(btn)btn.disabled=select.disabled
}

function refreshEnhancedSelectStates() {
  document.querySelectorAll('select[data-enhanced]').forEach(syncEnhancedSelect)
}

function closeEnhancedSelects(except) {
  document.querySelectorAll('.enhanced-select.open').forEach(wrap=> {
    if(wrap!==except) {
      wrap.classList.remove('open');const trigger=wrap.querySelector('.enhanced-select-trigger');if(trigger)trigger.setAttribute('aria-expanded','false')
    }
  })
}

document.addEventListener('DOMContentLoaded',enhanceSelectDropdowns)
document.addEventListener('click',()=>closeEnhancedSelects())
const automationState= {
  filter:'all',rules:[ {
    id:'peak',name:'Peak Demand Protection',condition:'Grid demand > 2.0 MW',action:'Reduce HVAC in low-occupancy zones by 8%',schedule:'Always active',impact:'126 kW',active:true,runs:12
  }, {
    id:'solarPriority',name:'Solar Priority',condition:'Solar generation > building demand',action:'Charge battery / export excess energy',schedule:'Solar production window',impact:'84 kW surplus',active:true,runs:7
  }, {
    id:'afterHours',name:'After Hours Optimization',condition:'Occupancy < 10% after 8 PM',action:'Reduce HVAC and lighting',schedule:'After business hours',impact:'68 kW',active:true,runs:5
  }
  ],activity:[ {
    type:'green',title:'HVAC load reduced',detail:'Peak Demand Protection shifted 126 kW',time:'Today'
  }, {
    type:'green',title:'Solar export started',detail:'Solar Priority exported 84 kW surplus',time:'Yesterday'
  }
  ]
};

function initAutomationPage() {
  renderAutomationPage()
}

function renderAutomationPage() {
  const rulesEl=document.getElementById('automationRules');
  if(!rulesEl)return;
  const rules=automationState.rules.filter(rule=>automationState.filter==='all'||(automationState.filter==='active'?rule.active:!rule.active));
  rulesEl.innerHTML=rules.length?rules.map(renderAutomationRule).join(''):'<div class="automation-empty">No automation rules match this filter.</div>';
  renderAutomationActivity();
  updateAutomationSummary()
}

function renderAutomationRule(rule) {
  return '<article class="card automation-rule '+(rule.active?'':'paused')+'"><div class="automation-rule-head"><div><h2>'+escapeAutomationHtml(rule.name)+'</h2><div class="sub">'+(rule.active?'Monitoring live conditions':'Paused by operator')+'</div></div><button class="toggle '+(rule.active?'on':'')+'" type="button" aria-label="Toggle '+escapeAutomationHtml(rule.name)+'" onclick="toggleAutomationRule(\''+rule.id+'\')"></button></div><div class="automation-flow"><div class="automation-step"><strong>IF</strong><span>'+escapeAutomationHtml(rule.condition)+'</span></div><div class="automation-step"><strong>THEN</strong><span>'+escapeAutomationHtml(rule.action)+'</span></div></div><span class="status '+(rule.active?'':'warn')+'">'+(rule.active?'Active':'Paused')+'</span><div class="automation-meta"><span>'+escapeAutomationHtml(rule.schedule)+'</span><span>'+escapeAutomationHtml(rule.impact)+'</span><span>'+rule.runs+' runs</span></div><div class="automation-actions"><button class="secondary" type="button" onclick="runAutomationRule(\''+rule.id+'\')">Run now</button><button class="secondary" type="button" onclick="duplicateAutomationRule(\''+rule.id+'\')">Duplicate</button><button class="danger-soft" type="button" onclick="deleteAutomationRule(\''+rule.id+'\')">Delete</button></div></article>'
}

function renderAutomationActivity() {
  const el=document.getElementById('automationActivity');
  if(!el)return;
  el.innerHTML=automationState.activity.length?automationState.activity.map(item=>'<div class="alert"><i class="alert-icon '+item.type+'"></i><div><b>'+escapeAutomationHtml(item.title)+'</b><p>'+escapeAutomationHtml(item.detail)+'</p></div><small>'+escapeAutomationHtml(item.time)+'</small></div>').join(''):'<div class="automation-empty">No recent automation activity.</div>'
}

function updateAutomationSummary() {
  const active=automationState.rules.filter(rule=>rule.active).length;
  const shifted=automationState.rules.filter(rule=>rule.active).reduce((total,rule)=>total+(parseInt(rule.impact,10)||0),0);
  const savings=Math.round(shifted*.68);
  const activeEl=document.getElementById('automationActiveCount');
  const shiftedEl=document.getElementById('automationShifted');
  const savingsEl=document.getElementById('automationSavings');
  if(activeEl)activeEl.textContent=active;
  if(shiftedEl)shiftedEl.textContent=shifted+' kW';
  if(savingsEl)savingsEl.textContent='$'+savings
}

function setAutomationFilter(filter,button) {
  automationState.filter=filter;
  document.querySelectorAll('.automation-tabs button').forEach(btn=>btn.classList.remove('sel'));
  if(button)button.classList.add('sel');
  renderAutomationPage()
}

function addAutomationActivity(type,title,detail) {
  automationState.activity.unshift( {
    type,title,detail,time:'Now'
  });
  automationState.activity=automationState.activity.slice(0,6);
  renderAutomationActivity()
}

function toggleAutomationRule(id) {
  const rule=automationState.rules.find(item=>item.id===id);
  if(!rule)return;
  rule.active=!rule.active;
  addAutomationActivity(rule.active?'green':'paused',rule.active?'Automation enabled':'Automation paused',rule.name+' is now '+(rule.active?'active':'paused'));
  renderAutomationPage();
  toast(rule.name+' '+(rule.active?'enabled':'paused'))
}

function runAutomationRule(id) {
  const rule=automationState.rules.find(item=>item.id===id);
  if(!rule)return;
  rule.runs+=1;
  addAutomationActivity('system','Manual run completed',rule.name+' executed successfully - '+rule.impact+' impact');
  renderAutomationPage();
  toast(rule.name+' executed')
}

function duplicateAutomationRule(id) {
  const rule=automationState.rules.find(item=>item.id===id);
  if(!rule)return;
  const copy= {
    ...rule,id:'rule'+Date.now(),name:rule.name+' Copy',runs:0
  };
  automationState.rules.unshift(copy);
  addAutomationActivity('system','Automation duplicated',copy.name+' created from '+rule.name);
  renderAutomationPage();
  toast(copy.name+' created')
}

function deleteAutomationRule(id) {
  const index=automationState.rules.findIndex(item=>item.id===id);
  if(index<0)return;
  const removed=automationState.rules.splice(index,1)[0];
  addAutomationActivity('deleted','Automation deleted',removed.name+' removed from active rules');
  renderAutomationPage();
  toast(removed.name+' deleted')
}

function openAutomationBuilder() {
  const builder=document.getElementById('automationBuilder');
  const overlay=document.getElementById('automationModalOverlay');
  if(builder) {
    builder.classList.add('show');
    builder.setAttribute('aria-hidden','false');
    document.body.classList.add('automation-modal-open');
    if(overlay)overlay.classList.add('show');
    refreshEnhancedSelectStates();
    setTimeout(()=> {
      const first=builder.querySelector('input,select,button');if(first)first.focus( {
        preventScroll:true
      })
    },40)
  }
  toast('Automation rule builder opened')
}

function closeAutomationBuilder() {
  const builder=document.getElementById('automationBuilder');
  const overlay=document.getElementById('automationModalOverlay');
  if(builder) {
    builder.classList.remove('show');
    builder.setAttribute('aria-hidden','true')
  }
  if(overlay)overlay.classList.remove('show');
  document.body.classList.remove('automation-modal-open')
}

function automationBuilderEscapeHandler(event) {
  if(event.key==='Escape') {
    const builder=document.getElementById('automationBuilder');
    if(builder&&builder.classList.contains('show'))closeAutomationBuilder()
  }
}

document.addEventListener('keydown',automationBuilderEscapeHandler)
function createAutomationRule() {
  const name=(document.getElementById('automationName').value||'New automation').trim();
  const condition=document.getElementById('automationCondition').value+' - '+(document.getElementById('automationThreshold').value||'configured threshold');
  const action=document.getElementById('automationAction').value;
  const schedule=document.getElementById('automationSchedule').value;
  const impact=(document.getElementById('automationImpact').value||'50 kW').trim();
  const rule= {
    id:'rule'+Date.now(),name,condition,action,schedule,impact,active:true,runs:0
  };
  automationState.rules.unshift(rule);
  closeAutomationBuilder();
  addAutomationActivity('green','Automation created',name+' is active with expected impact '+impact);
  renderAutomationPage();
  toast(name+' automation saved')
}

function simulateAutomationCycle() {
  automationState.rules.filter(rule=>rule.active).forEach(rule=>rule.runs+=1);
  addAutomationActivity('system','System check completed',automationState.rules.filter(rule=>rule.active).length+' active rules validated against live conditions');
  renderAutomationPage();
  toast('Automation system check completed')
}

function clearAutomationActivity() {
  automationState.activity=[];
  renderAutomationActivity();
  toast('Automation activity cleared')
}

function escapeAutomationHtml(value) {
  return String(value).replace(/[&<>"]/g,char=>( {
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'
  }
  [char]))
}

const hvacZoneProfiles= {

  'North Wing': {
    occupancy:72,efficiency:'Good',type:'Open office'
  },
  'East Wing': {
    occupancy:41,efficiency:'Watch',type:'Tenant office'
  },
  'South Wing': {
    occupancy:33,efficiency:'Good',type:'Low-occupancy office'
  },
  'West Wing': {
    occupancy:76,efficiency:'High load',type:'Open office'
  },
  'Conference': {
    occupancy:18,efficiency:'Efficient',type:'Meeting zone'
  },
  'Lobby': {
    occupancy:54,efficiency:'Efficient',type:'Public zone'
  }
};

let selectedHvacZoneCard=null;

function parseHvacZoneCard(card) {
  const label=card.querySelector('small')?.textContent.trim()||'';
  const loadText=card.querySelector('b')?.textContent.trim()||'0 kW';
  const match=label.match(/^(.+?)\s+([0-9]+(?:\.[0-9]+)?)C$/);
  const name=match?match[1].trim():label.replace(/[0-9.]+C/,'').trim();
  const temp=match?Number(match[2]):23;
  const load=Number((loadText.match(/[0-9.]+/)||['0'])[0]);
  const profile=hvacZoneProfiles[name]|| {
    occupancy:50,efficiency:'Good',type:'HVAC zone'
  };
  return {
    name,temp,load,...profile
  }
}

function getZoneHealth(zone) {
  if(zone.temp>=24.5||zone.load>=190)return {
    label:'Needs attention',tone:'warn',insight:zone.name+' is above the preferred comfort or load range. Optimization can reduce HVAC demand while keeping tenant comfort safe.'
  };
  if(zone.occupancy<35)return {
    label:'Low occupancy',tone:'blue',insight:zone.name+' has low occupancy, so it is a good candidate for setpoint control and load shifting.'
  };
  return {
    label:'Normal',tone:'green',insight:zone.name+' is operating within the expected comfort and energy range.'
  }
}

function initHvacZones() {
  document.querySelectorAll('#hvac .floor').forEach(card=> {
    card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label','Open HVAC zone details');card.addEventListener('click',()=>openZoneDetails(card));card.addEventListener('keydown',event=> {
      if(event.key==='Enter'||event.key===' ') {
        event.preventDefault();openZoneDetails(card)
      }
    });const zone=parseHvacZoneCard(card);if(zone.temp>=24.5||zone.load>=190)card.classList.add('zone-alert')
  })
}

function openZoneDetails(card) {
  selectedHvacZoneCard=card;
  const zone=parseHvacZoneCard(card);
  const health=getZoneHealth(zone);
  document.getElementById('zoneDetailTitle').textContent=zone.name;
  document.getElementById('zoneDetailSub').textContent=zone.type+' performance details';
  document.getElementById('zoneDetailStatus').textContent=health.label;
  document.getElementById('zoneDetailTemp').textContent=formatSetpoint(zone.temp)+' C';
  document.getElementById('zoneDetailLoad').textContent=Math.round(zone.load)+' kW';
  document.getElementById('zoneDetailOccupancy').textContent=zone.occupancy+'%';
  document.getElementById('zoneDetailEfficiency').textContent=zone.efficiency;
  document.getElementById('zoneDetailInsight').textContent=health.insight;
  document.getElementById('zoneDetailOverlay').classList.add('show');
  document.getElementById('zoneDetailModal').classList.add('show');
  document.body.classList.add('automation-modal-open')
}

function closeZoneDetails() {
  const overlay=document.getElementById('zoneDetailOverlay');
  const modal=document.getElementById('zoneDetailModal');
  if(overlay)overlay.classList.remove('show');
  if(modal)modal.classList.remove('show');
  document.body.classList.remove('automation-modal-open')
}

function updateZoneCard(card,temp,load) {
  const zone=parseHvacZoneCard(card);
  const label=card.querySelector('small');
  const loadEl=card.querySelector('b');
  if(label)label.textContent=zone.name+'  '+formatSetpoint(temp)+'C';
  if(loadEl)loadEl.textContent=Math.round(load)+' kW';
  card.classList.remove('zone-alert');
  if(temp>=24.5||load>=190)card.classList.add('zone-alert');
  card.classList.remove('setpoint-updated');
  void card.offsetWidth;
  card.classList.add('setpoint-updated')
}

function optimizeSelectedZone() {
  if(!selectedHvacZoneCard)return;
  const zone=parseHvacZoneCard(selectedHvacZoneCard);
  const optimizedLoad=Math.max(30,zone.load*.92);
  const optimizedTemp=zone.temp>24.5?zone.temp-.5:zone.temp;
  updateZoneCard(selectedHvacZoneCard,optimizedTemp,optimizedLoad);
  selectedHvacZoneCard.classList.add('zone-optimized');
  openZoneDetails(selectedHvacZoneCard);
  toast(zone.name+' optimized: load reduced by '+Math.round(zone.load-optimizedLoad)+' kW')
}

function applySetpointToSelectedZone() {
  if(!selectedHvacZoneCard)return;
  const value=getSetpointValue();
  if(value===null||value<18||value>28) {
    previewSetpointDraft();
    toast('Setpoint must be between 18C and 28C');
    return
  }
  const zone=parseHvacZoneCard(selectedHvacZoneCard);
  updateZoneCard(selectedHvacZoneCard,value,zone.load);
  selectedHvacZoneCard.classList.add('zone-optimized');
  openZoneDetails(selectedHvacZoneCard);
  toast(zone.name+' updated to '+formatSetpoint(value)+'C')
}

document.addEventListener('keydown',event=> {
  if(event.key==='Escape') {
    const modal=document.getElementById('zoneDetailModal');if(modal&&modal.classList.contains('show'))closeZoneDetails()
  }
})
function openHelpSupport() {
  const overlay=document.getElementById('helpSupportOverlay');
  const modal=document.getElementById('helpSupportModal');
  if(overlay)overlay.classList.add('show');
  if(modal) {
    modal.classList.add('show');
    setTimeout(()=>document.getElementById('helpSearchInput')?.focus( {
      preventScroll:true
    }),40)
  }
  document.body.classList.add('automation-modal-open')
}

function closeHelpSupport() {
  const overlay=document.getElementById('helpSupportOverlay');
  const modal=document.getElementById('helpSupportModal');
  if(overlay)overlay.classList.remove('show');
  if(modal)modal.classList.remove('show');
  document.body.classList.remove('automation-modal-open')
}

function filterHelpTopics(query) {
  const value=String(query||'').toLowerCase().trim();
  let visible=0;
  document.querySelectorAll('#helpTopicList .help-topic').forEach(topic=> {
    const text=(topic.textContent+' '+(topic.dataset.help||'')).toLowerCase();const match=!value||text.includes(value);topic.style.display=match?'flex':'none';if(match)visible++
  });
  const empty=document.getElementById('helpEmpty');
  if(empty)empty.classList.toggle('show',visible===0)
}

function runOverviewGuide() {
  closeHelpSupport();
  go('overview');
  const targets=document.querySelectorAll('#overview .kpi,.demand-panel,.solar-card,.recommend');
  targets.forEach((el,index)=> {
    setTimeout(()=> {
      el.classList.add('overview-guide-highlight');setTimeout(()=>el.classList.remove('overview-guide-highlight'),2300)
    },index*160)
  });
  toast('Overview guide started: highlighted the main dashboard areas')
}

function copySupportId() {
  const id='GB-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-MOON';
  navigator.clipboard?.writeText(id).then(()=>toast('Support ID copied: '+id)).catch(()=>toast('Support ID: '+id))
}

function submitSupportTicket() {
  const message=(document.getElementById('supportMessage')?.value||'').trim();
  if(message.length<8) {
    toast('Please describe the issue before submitting');
    return
  }
  const id='GB-'+Date.now().toString().slice(-6);
  document.getElementById('supportMessage').value='';
  closeHelpSupport();
  toast('Support ticket '+id+' submitted')
}

document.addEventListener('keydown',event=> {
  if(event.key==='Escape') {
    const modal=document.getElementById('helpSupportModal');if(modal&&modal.classList.contains('show'))closeHelpSupport()
  }
})
function csvEscape(value) {
  return '"'+String(value).replace(/"/g,'""')+'"'
}

function downloadImpactSummary() {
  const now=new Date();
  const rows=[['GridBalance Sustainability Impact Summary'],['Generated at',now.toLocaleString()],[],['Metric','Value'],['CO2 Avoided','84.2 tons'],['Renewable Energy','41.8%'],['Energy Saved','12.6 MWh'],['Equivalent Trees','3,842'],['Sustainability Score','82 / 100'],['Score Grade','A'],[],['Monthly CO2 Reduction','Value'],['January','32 tons'],['February','46 tons'],['March','39 tons'],['April','61 tons'],['May','72 tons'],['June','84 tons'],['July','96 tons'],[],['Recommendation','Maintain HVAC setpoint optimization and solar load shifting to continue reducing peak demand and emissions.']];
  const csv=rows.map(row=>row.map(csvEscape).join(',')).join('\n');
  const blob=new Blob([csv], {
    type:'text/csv;charset=utf-8'
  });
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  const date=now.toISOString().slice(0,10);
  link.href=url;
  link.download='gridbalance-impact-summary-'+date+'.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast('Impact summary downloaded as CSV')
}

function showSustainabilityValue(event,bar) {
  const tip=document.getElementById('sustainTooltip');
  if(!tip||!bar)return;
  tip.textContent=bar.dataset.value||'';
  let left,top;
  if(event) {
    left=event.clientX+12;
    top=event.clientY-34
  } else {
    const rect=bar.getBoundingClientRect();
    left=rect.left+rect.width/2;
    top=rect.top-30
  }
  tip.style.left=left+'px';
  tip.style.top=top+'px';
  tip.classList.add('show')
}

function hideSustainabilityValue() {
  const tip=document.getElementById('sustainTooltip');
  if(tip)tip.classList.remove('show')
}

function animateSustainability() {
  const section=document.getElementById('sustainability');
  if(!section||!section.classList.contains('active'))return;
  const chart=document.getElementById('sustainabilityBarChart');
  const ring=document.getElementById('sustainScoreRing');
  [chart,ring].forEach(el=> {
    if(!el)return;el.classList.remove('animate');void el.offsetWidth;el.classList.add('animate')
  })
}

function initSustainability() {
  animateSustainability();
  const section=document.getElementById('sustainability');
  if(!section)return;
  new MutationObserver(animateSustainability).observe(section, {
    attributes:true,attributeFilter:['class']
  })
}

document.addEventListener('DOMContentLoaded',initSustainability)
document.addEventListener('DOMContentLoaded',restoreSetpoint)
document.addEventListener('DOMContentLoaded',initHvacZones)
document.addEventListener('DOMContentLoaded',initAutomationPage)
function replayLoadBalancerAnimation(section) {

  if(!section)return;

  section.classList.remove('loadBalancerAnimate');

  void section.offsetWidth;

  section.classList.add('loadBalancerAnimate');
}

function initLoadBalancerAnimations() {

  const section=document.getElementById('balancer');

  if(section&&section.classList.contains('active'))replayLoadBalancerAnimation(section);
}

document.addEventListener('DOMContentLoaded',initLoadBalancerAnimations);

const loginRoleCredentials= {

  facility: {
    label:'Facility Manager',short:'Manager',email:'moon@meridianre.com',password:'password',note:'Facility Manager credentials loaded'
  },
  analyst: {
    label:'Energy Analyst',short:'Analyst',email:'analyst@meridianre.com',password:'analytics',note:'Energy Analyst credentials loaded'
  },
  admin: {
    label:'Operations Admin',short:'Admin',email:'admin@meridianre.com',password:'admin123',note:'Operations Admin credentials loaded'
  }
};

let activeLoginRole='facility';

let activeAuthMode='signin';

function selectLoginRole(role) {

  const data=loginRoleCredentials[role]||loginRoleCredentials.facility;

  activeLoginRole=role;

  document.querySelectorAll('.role-pills button').forEach(btn=>btn.classList.toggle('active',btn.dataset.role===role));

  const email=document.getElementById('loginEmail');

  const password=document.getElementById('loginPassword');

  const note=document.getElementById('loginAutofillNote');

  if(email)email.value=data.email;

  if(password)password.value=data.password;

  if(note)note.textContent=data.note;
}

function setAuthMode(mode) {

  activeAuthMode=mode==='signup'?'signup':'signin';

  document.getElementById('signInTab')?.classList.toggle('active',activeAuthMode==='signin');

  document.getElementById('signUpTab')?.classList.toggle('active',activeAuthMode==='signup');

  const title=document.getElementById('authTitle');

  const subtitle=document.getElementById('authSubtitle');

  const submit=document.getElementById('authSubmit');

  const text=document.getElementById('authSwitchText');

  const link=document.getElementById('authSwitchLink');

  if(title)title.textContent=activeAuthMode==='signin'?'Welcome back':'Create account';

  if(subtitle)subtitle.textContent=activeAuthMode==='signin'?'Use the role and saved demo account.':'Create a demo workspace profile.';

  if(submit)submit.textContent=activeAuthMode==='signin'?'Sign in':'Sign up';

  if(text)text.textContent=activeAuthMode==='signin'?'Not registered?':'Already registered?';

  if(link)link.textContent=activeAuthMode==='signin'?'Create an account':'Sign in instead';
}

function toggleAuthMode() {
  setAuthMode(activeAuthMode==='signin'?'signup':'signin')
}

function forgotPassword() {
  toast('Password reset link prepared for '+(document.getElementById('loginEmail')?.value||'this account'))
}

function continueWithGoogle() {
  selectLoginRole(activeLoginRole);
  toast('Google sign-in connected as '+loginRoleCredentials[activeLoginRole].label);
  setTimeout(enterApp,450)
}

document.addEventListener('DOMContentLoaded',()=>selectLoginRole(activeLoginRole));
