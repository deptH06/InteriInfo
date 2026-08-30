const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const KEY = "atelier_inventory_v1";
let state = JSON.parse(localStorage.getItem(KEY) || '{"users":[],"session":null,"customers":[],"materials":[]}');
let activeCustomerId = null;
let authMode = "login";

function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function id(prefix="id"){ return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2,7); }
function money(n){ return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n)||0); }
function esc(v){ return String(v ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function currentUser(){ return state.users.find(u=>u.id===state.session); }

function showAuth(){
  $("#authView").classList.remove("hidden");
  $("#appView").classList.add("hidden");
}
function showApp(){
  $("#authView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  $("#userLabel").textContent = currentUser()?.name || currentUser()?.email || "";
  renderCustomers();
  renderInventory();
  renderSummary();
}
function switchAuth(mode){
  authMode = mode;
  $$(".tab").forEach(b=>b.classList.toggle("active", b.dataset.auth===mode));
  $("#nameField").classList.toggle("hidden", mode!=="register");
  $("#authSubmit").textContent = mode==="register" ? "Create account" : "Enter workspace";
  $("#authMessage").textContent = "";
}
$$(".tab").forEach(b=>b.addEventListener("click",()=>switchAuth(b.dataset.auth)));

$("#authForm").addEventListener("submit", e=>{
  e.preventDefault();
  const email=$("#authEmail").value.trim().toLowerCase(), password=$("#authPassword").value;
  if(authMode==="register"){
    const name=$("#authName").value.trim();
    if(!name) return $("#authMessage").textContent="Please enter your name.";
    if(state.users.some(u=>u.email===email)) return $("#authMessage").textContent="An account with this email already exists.";
    const user={id:id("user"),name,email,password};
    state.users.push(user); state.session=user.id; save(); e.target.reset(); showApp();
  }else{
    const user=state.users.find(u=>u.email===email);
    if(!user){
      $("#authMessage").textContent="No account found with this email.";
      return;
    }
    if(user.password!==password){
      $("#authMessage").textContent="Incorrect password. You can change it below.";
      $("#resetEmail").value=email;
      $("#passwordResetPanel").classList.remove("hidden");
      return;
    }
    state.session=user.id; save(); e.target.reset(); showApp();
  }
});
$("#changePasswordBtn").addEventListener("click",()=>{
  $("#passwordResetPanel").classList.toggle("hidden");
  $("#authMessage").textContent="";
  if($("#authEmail").value.trim()) $("#resetEmail").value=$("#authEmail").value.trim().toLowerCase();
});

$("#cancelPasswordReset").addEventListener("click",()=>{
  $("#passwordResetPanel").classList.add("hidden");
  $("#passwordResetForm").reset();
  $("#authMessage").textContent="";
});

$("#passwordResetForm").addEventListener("submit",e=>{
  e.preventDefault();
  const email=$("#resetEmail").value.trim().toLowerCase();
  const newPassword=$("#resetPassword").value;
  const confirmPassword=$("#resetPasswordConfirm").value;
  const user=state.users.find(u=>u.email===email);

  if(!user){
    $("#authMessage").textContent="No account found with this email.";
    return;
  }
  if(newPassword!==confirmPassword){
    $("#authMessage").textContent="The new passwords do not match.";
    return;
  }
  if(newPassword.length<4){
    $("#authMessage").textContent="Password must be at least 4 characters.";
    return;
  }

  user.password=newPassword;
  save();
  $("#passwordResetForm").reset();
  $("#passwordResetPanel").classList.add("hidden");
  $("#authMessage").textContent="Password changed successfully. You can now log in.";
});

$("#logoutBtn").addEventListener("click",()=>{state.session=null;save();showAuth();});

function activate(view){
  $$(".view").forEach(v=>v.classList.toggle("hidden",v.id!==view+"View"));
  $$(".step").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  if(view==="inventory") renderInventory();
  if(view==="summary") renderSummary();
  window.scrollTo({top:0,behavior:"smooth"});
}
$$(".step").forEach(b=>b.addEventListener("click",()=>activate(b.dataset.view)));

$("#addCustomerBtn").addEventListener("click",()=>{
  $("#customerFormWrap").classList.remove("hidden");
  $("#customerFormTitle").textContent="New customer";
  $("#customerForm").reset(); $("#customerId").value="";
});
$("#cancelCustomer").addEventListener("click",()=>$("#customerFormWrap").classList.add("hidden"));

$("#customerForm").addEventListener("submit",e=>{
  e.preventDefault();
  const cid=$("#customerId").value;
  const data={name:$("#customerName").value.trim(),phone:$("#customerPhone").value.trim(),address:$("#customerAddress").value.trim()};
  if(cid){ Object.assign(state.customers.find(c=>c.id===cid),data); }
  else { data.id=id("customer"); data.userId=state.session; state.customers.push(data); activeCustomerId=data.id; }
  save(); $("#customerFormWrap").classList.add("hidden"); renderCustomers(); renderInventory(); renderSummary();
});
function editCustomer(cid){
  const c=state.customers.find(x=>x.id===cid); if(!c)return;
  $("#customerFormWrap").classList.remove("hidden"); $("#customerFormTitle").textContent="Edit customer";
  $("#customerId").value=c.id; $("#customerName").value=c.name; $("#customerPhone").value=c.phone; $("#customerAddress").value=c.address;
  window.scrollTo({top:0,behavior:"smooth"});
}
function selectCustomer(cid){activeCustomerId=cid;activate("inventory");renderInventory();renderSummary();}
function deleteCustomer(cid){
  if(!confirm("Delete this customer? Their materials will also be removed."))return;
  state.customers=state.customers.filter(c=>c.id!==cid);
  state.materials=state.materials.filter(m=>m.customerId!==cid);
  if(activeCustomerId===cid)activeCustomerId=null;
  save();renderCustomers();renderInventory();renderSummary();
}
function renderCustomers(){
  const mine=state.customers.filter(c=>c.userId===state.session);
  $("#customerGrid").innerHTML=mine.length ? mine.map(c=>`
    <article class="customer-card glass">
      <p class="eyebrow">CLIENT</p><h3>${esc(c.name)}</h3>
      <div class="detail">☎ ${esc(c.phone)}</div><div class="detail">⌂ ${esc(c.address)}</div>
      <div class="card-actions">
        <button class="primary small" onclick="selectCustomer('${c.id}')">Open workspace</button>
        <button class="ghost small" onclick="editCustomer('${c.id}')">Edit</button>
        <button class="ghost small" onclick="deleteCustomer('${c.id}')">Delete</button>
      </div>
    </article>`).join("") : `<div class="glass empty" style="grid-column:1/-1"><h3>No customers yet</h3><p class="muted">Start by adding your first client.</p><button class="primary" onclick="$('#addCustomerBtn').click()">+ Add customer</button></div>`;
}
$("#addMaterialBtn").addEventListener("click",()=>{
  if(!activeCustomerId) return alert("Select a customer first.");
  $("#materialFormWrap").classList.remove("hidden"); $("#materialForm").reset(); $("#materialId").value=""; $("#materialFormTitle").textContent="Add material";
});
$("#cancelMaterial").addEventListener("click",()=>$("#materialFormWrap").classList.add("hidden"));
$("#materialForm").addEventListener("submit",e=>{
  e.preventDefault();
  if(!activeCustomerId)return;
  const mid=$("#materialId").value;
  const data={name:$("#materialName").value.trim(),category:$("#materialCategory").value.trim(),price:Number($("#materialPrice").value),qty:Number($("#materialQty").value),notes:$("#materialNotes").value.trim(),customerId:activeCustomerId,userId:state.session};
  if(mid)Object.assign(state.materials.find(m=>m.id===mid),data);else{data.id=id("material");state.materials.push(data);}
  save();$("#materialFormWrap").classList.add("hidden");renderInventory();renderSummary();
});
function editMaterial(mid){
  const m=state.materials.find(x=>x.id===mid);if(!m)return;
  $("#materialFormWrap").classList.remove("hidden");$("#materialFormTitle").textContent="Edit material";
  $("#materialId").value=m.id;$("#materialName").value=m.name;$("#materialCategory").value=m.category;$("#materialPrice").value=m.price;$("#materialQty").value=m.qty;$("#materialNotes").value=m.notes;
  window.scrollTo({top:0,behavior:"smooth"});
}
function deleteMaterial(mid){
  if(!confirm("Delete this material?"))return;
  state.materials=state.materials.filter(m=>m.id!==mid);save();renderInventory();renderSummary();
}
function renderInventory(){
  const c=state.customers.find(x=>x.id===activeCustomerId);
  $("#activeCustomerBanner").innerHTML=c ? `<strong>Selected customer:</strong> ${esc(c.name)} · ${esc(c.phone)} <button class="ghost small" style="float:right" onclick="activate('customers')">Change</button>` : `<strong>No customer selected.</strong> Go to Customers and open a workspace.`;
  const ms=state.materials.filter(m=>m.customerId===activeCustomerId && m.userId===state.session);
  $("#materialTableWrap").innerHTML=ms.length ? `<table class="inventory-table"><thead><tr><th>Material</th><th>Category</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead><tbody>${ms.map(m=>`<tr><td><strong>${esc(m.name)}</strong><br><small class="muted">${esc(m.notes)}</small></td><td>${esc(m.category)}</td><td>${money(m.price)}</td><td>${m.qty}</td><td>${money(m.price*m.qty)}</td><td><div class="row-actions"><button class="ghost small" onclick="editMaterial('${m.id}')">Edit</button><button class="ghost small" onclick="deleteMaterial('${m.id}')">Delete</button></div></td></tr>`).join("")}</tbody></table>` : `<div class="empty"><h3>No materials added</h3><p class="muted">Your inventory for this customer is empty. Add materials manually whenever required.</p><button class="primary" onclick="$('#addMaterialBtn').click()">+ Add material</button></div>`;
}
function renderSummary(){
  const c=state.customers.find(x=>x.id===activeCustomerId);
  const ms=state.materials.filter(m=>m.customerId===activeCustomerId && m.userId===state.session);
  if(!c){$("#summaryCard").innerHTML=`<div class="empty"><h3>Select a customer</h3><p class="muted">Open a customer workspace to build a summary.</p></div>`;return;}
  const total=ms.reduce((s,m)=>s+m.price*m.qty,0);
  $("#summaryCard").innerHTML=`<div class="summary-head"><div><p class="eyebrow">CUSTOMER</p><h3>${esc(c.name)}</h3><p class="muted">${esc(c.phone)} · ${esc(c.address)}</p></div><div><p class="eyebrow">TOTAL</p><div class="summary-total">${money(total)}</div></div></div>${ms.length?`<table class="summary-table"><tbody>${ms.map(m=>`<tr><td><strong>${esc(m.name)}</strong><br><small class="muted">${esc(m.category)} · ${m.qty}</small></td><td>${money(m.price*m.qty)}</td></tr>`).join("")}<tr class="grand"><td>Grand total</td><td>${money(total)}</td></tr></tbody></table>`:`<div class="empty"><h3>No materials yet</h3><p class="muted">Add materials from the Inventory page.</p></div>`}`;
}
$("#printBtn").addEventListener("click",()=>window.print());

if(state.session && currentUser()) showApp(); else showAuth();
