import test from 'node:test';
import assert from 'node:assert/strict';
import {licenseInfo,parseMetadata,archiveVariant} from '../server/archive.js';
import {yearParam,pageParam} from '../server/utils.js';
const sample = {
  metadata:{mediatype:'movies',title:'Película de prueba',licenseurl:'https://creativecommons.org/licenses/by/4.0/',year:'1950',creator:'Archivo de prueba'},
  files:[{name:'pelicula.mp4',size:'35000000',source:'original',format:'MPEG4'}]
};
test('licencias Creative Commons y dominio público reconocibles',()=>{
  assert.equal(licenseInfo('https://creativecommons.org/licenses/by/4.0/')?.label,'CC BY');
  assert.equal(licenseInfo('http://creativecommons.org/publicdomain/mark/1.0/')?.label,'Marcada como dominio público');
  assert.equal(licenseInfo('https://creativecommons.org/publicdomain/zero/1.0/')?.label,'CC0');
  assert.equal(licenseInfo('Licencia sin especificar'),null);
});
test('no ofrece descargas sin comprobar disponibilidad técnica',()=>{
  const found=parseMetadata('identificador_de_prueba',sample);
  assert.ok(found);
  assert.equal(found.downloadVerified,false);
  assert.equal(found.downloadUrl,null);
  assert.equal(found.sourceUrl,'https://archive.org/details/identificador_de_prueba');
});
test('rechaza elementos sin licencia o sin un archivo de video reconocible',()=>{
  assert.equal(parseMetadata('test_no_licencia',{...sample,metadata:{...sample.metadata,licenseurl:''}}),null);
  assert.equal(parseMetadata('test_no_video',{...sample,files:[{name:'documento.pdf',size:'50000000'}]}),null);
  assert.equal(parseMetadata('test_no_pelicula',{...sample,metadata:{...sample.metadata,mediatype:'texts'}}),null);
});
test('limita entradas de paginación y año',()=>{
  assert.equal(pageParam('100000'),150);
  assert.equal(pageParam('3'),3);
  assert.equal(yearParam('1989'),'1989');
  assert.equal(yearParam('1989 OR 1=1'),'');
});

test('usa calidad real del archivo y no promete 4K si no hay resolución registrada',()=>{
 const found=parseMetadata('prueba_calidad',{
  ...sample,
  metadata:{...sample.metadata,language:'Spanish'},
  files:[
   {name:'obra_es_720.mp4',size:'50000000',width:'1280',height:'720',source:'original'},
   {name:'obra_es_1080.mp4',size:'130000000',width:'1920',height:'1080',source:'derivative'},
   {name:'obra.mp4',size:'70000000',source:'derivative'},
  ]
 });
 assert.ok(found);
 assert.deepEqual(found.declaredLanguages,['es']);
 assert.equal(found.variants.find(v=>v.height===1080)?.quality,'1080p');
 assert.equal(found.variants.find(v=>v.height===720)?.quality,'720p');
 assert.equal(found.variants.find(v=>v.height===null)?.quality,'Resolución no indicada');
 assert.equal(found.variants.some(v=>v.quality.startsWith('4K')),false);
 assert.equal(found.downloadUrl,null);
});

test('diferencia idioma declarado del nombre de archivo y del registro',()=>{
 const found=parseMetadata('prueba_idiomas',{
  ...sample,metadata:{...sample.metadata,language:['Spanish','English']},
  files:[
   {name:'cine_spanish.mp4',size:'70000000',source:'original',width:'3840',height:'2160'},
   {name:'cine_english.mp4',size:'70000000',source:'derivative',height:'1080'},
   {name:'cine_sin_pista.mp4',size:'70000000',source:'derivative'},
  ]
 });
 assert.ok(found);
 assert.equal(found.variants[0].quality,'4K (2160p)');
 assert.equal(found.variants[0].language,'es');
 assert.equal(found.variants[0].languageSource,'archivo');
 assert.equal(found.variants[1].language,'en');
 assert.equal(found.variants[2].language,null);
});


test('comprueba cada versión antes de devolver el enlace directo',async()=>{
 const fetchOriginal=globalThis.fetch;
 const requests:string[]=[];
 try{
  globalThis.fetch=async (input,init)=>{
   const url=String(input);requests.push(`${init?.method||'GET'} ${url}`);
   if(url.includes('/metadata/'))return new Response(JSON.stringify(sample),{status:200,headers:{'Content-Type':'application/json'}});
   if(init?.method==='HEAD')return new Response(null,{status:200,headers:{'Content-Type':'video/mp4'}});
   return new Response(null,{status:404});
  };
  const response=await archiveVariant('archivo_con_licencia_de_prueba',0);
  assert.equal(response.verified,true);
  assert.equal(response.downloadUrl,'https://archive.org/download/archivo_con_licencia_de_prueba/pelicula.mp4');
  assert.ok(requests.some(r=>r.startsWith('HEAD https://archive.org/download/')));
  await assert.rejects(()=>archiveVariant('archivo_con_licencia_de_prueba',999),{code:'INVALID_VARIANT'});
 }finally{globalThis.fetch=fetchOriginal;}
});
