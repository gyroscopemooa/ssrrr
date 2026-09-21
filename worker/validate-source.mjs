import {collectSource} from './source-pipeline.mjs';
export async function validateSource(source,options={}){return collectSource(source,{...options,test:true})}
