document.getElementById("form").addEventListener("submit",async e=>{
e.preventDefault();const r=document.getElementById("result");r.textContent="Analyzing...";
const data=Object.fromEntries(new FormData(e.target).entries());
try{const x=await fetch("/predict",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
const j=await x.json();r.innerHTML="<b>Prediction: "+j.prediction+"</b><br>"+j.message}
catch(err){r.textContent="Server connection failed."}});
