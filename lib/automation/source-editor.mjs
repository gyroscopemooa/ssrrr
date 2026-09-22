import {requiredFields} from './modes.mjs';
// Defaults are for rendering only. Editing one field must not persist unrelated defaults.
export function sourceEditorFields(source){return {
 ...source,
 requiredFields:source.requiredFields??requiredFields(source),
 optionalFields:source.optionalFields??['comments','video','views','recommends','author','createdAt'],
 listSelectors:source.listSelectors??{body:'',thumbnail:'',video:'',author:''},
 customStages:source.customStages??{detail:true,comments:false,media:true},
};}
