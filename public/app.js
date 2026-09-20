const code=document.querySelector("#code"), lang=document.querySelector("#language"), go=document.querySelector("#go"), count=document.querySelector("#count");
const empty=document.querySelector("#empty"), loading=document.querySelector("#loading"), result=document.querySelector("#result"), error=document.querySelector("#error");
function update(){count.textContent=`${code.value.length.toLocaleString()} characters`} update();
function show(x){[empty,loading,result,error].forEach(e=>e.classList.add("hidden"));x.classList.remove("hidden")}
go.onclick=async()=>{
  if(!code.value.trim()){error.textContent="Paste some code first.";show(error);return}
  go.disabled=true;go.textContent="Analyzing…";show(loading);
  try{
    const r=await fetch("/api/explain",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({language:lang.value,code:code.value})});
    const d=await r.json(); if(!r.ok) throw new Error(d.error||"Request failed.");
    ["overview","steps","complexity","improvements"].forEach(k=>document.querySelector("#"+k).textContent=d[k]);
    show(result);
  }catch(e){error.textContent=e.message;show(error)}finally{go.disabled=false;go.textContent="✦ Explain Code"}
}; code.oninput=update;