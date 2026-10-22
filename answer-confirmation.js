import {resolveAnswer} from './answer-matching.js';
export const needsConfirmation=result=>result?.status==='matched'&&!result.answer?.abbreviated;
export function deadlineAnswer(pack,text){const result=resolveAnswer(pack,text);return needsConfirmation(result)?null:result.answer??null;}
// Only a submit proposes a replacement. Another submit confirms it. Editing,
// changing turns/categories and leaving the form invalidate the proposal.
export class AnswerConfirmation{
 constructor({form,input,button,container,pack,onSubmit,beforeSubmit=()=>{},active=()=>true,context=()=>''}){
  Object.assign(this,{form,input,button,container,pack,onSubmit,beforeSubmit,active,context,originalLabel:button.textContent});
  this.inputListener=()=>this.clear();
  this.submitListener=e=>{e.preventDefault();this.beforeSubmit();this.submit();};
  input.addEventListener('input',this.inputListener);form.addEventListener('submit',this.submitListener);
 }
 clear(){this.pending=null;this.container.replaceChildren();this.container.hidden=true;this.button.textContent=this.originalLabel;this.input.removeAttribute('aria-describedby');}
 show(answer){
  this.pending={answer,input:this.input.value,context:this.context()};this.container.hidden=false;
  this.container.innerHTML='<p></p><small>Submit again to confirm · or edit</small>';
  this.container.querySelector('p').textContent='Did you mean “'+answer.label+'”?';
  this.input.value=answer.label;this.input.setAttribute('aria-describedby',this.container.id);this.input.focus();
 }
 confirm(){const p=this.pending;if(!p||!this.active()||p.context!==this.context()||p.answer.label!==this.input.value){this.clear();return;}this.clear();this.onSubmit(p.answer.label,{from:p.input,corrected:true});}
 submit(){
  if(!this.active())return;
  if(this.pending?.context===this.context()&&this.pending.answer.label===this.input.value){this.confirm();return;}
  const result=resolveAnswer(this.pack(),this.input.value);
  if(needsConfirmation(result))this.show(result.answer);
  else{this.clear();this.onSubmit(this.input.value,{corrected:false});}
 }
 invalidate(){if(this.pending&&this.pending.context!==this.context())this.clear();}
 destroy(){this.clear();this.input.removeEventListener('input',this.inputListener);this.form.removeEventListener('submit',this.submitListener);}
}
