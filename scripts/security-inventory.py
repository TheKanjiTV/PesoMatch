from pathlib import Path
import subprocess,re,json,hashlib
root=Path(__file__).resolve().parents[1]
def git(*args): return subprocess.check_output(['git',*args],cwd=root)
envs=list(root.glob('.env*'))+list((root/'backend').glob('.env*'))
secrets=[]; envflags={}
for p in envs:
    if p.name.endswith('.example'):continue
    text=p.read_text(encoding='utf-8-sig')
    values=dict(re.findall(r'^([A-Z][A-Z0-9_]*)=(.*)$',text,re.M))
    for k,v in values.items():
        v=v.strip().strip('"\'')
        if re.search(r'KEY|SECRET|TOKEN|PASSWORD',k) and len(v)>=12:secrets.append((k,v))
    envflags[str(p.relative_to(root))]={'git_ignored':subprocess.run(['git','check-ignore','-q',str(p.relative_to(root))],cwd=root).returncode==0,'production_env':values.get('APP_ENV')=='production','debug_enabled':values.get('APP_DEBUG')=='true','db_administrative_user':values.get('DB_USERNAME','').strip('"\'') in ['root','sa','postgres'],'empty_db_password':not values.get('DB_PASSWORD','').strip('"\''),'session_secure':values.get('SESSION_SECURE_COOKIE')=='true','session_encrypt':values.get('SESSION_ENCRYPT')=='true','has_application_key':bool(values.get('APP_KEY'))}
patterns={
 'private_key':re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
 'provider_token':re.compile(r'\b(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{32,})\b'),
 'credential_assignment':re.compile(r'(?im)(?:^|[\s\"\'])(?:APP_KEY|DB_PASSWORD|API_SECRET|AWS_SECRET_ACCESS_KEY|SERVICE_ROLE_KEY)[ \t]*[\"\']?[ \t]*[:=][ \t]*[\"\']?([^\s\"\',;}{]{12,})')
}
hits=[]; seen=set(); blobs=0
for row in git('rev-list','--objects','--all').decode().splitlines():
    oid,_,name=row.partition(' ')
    if oid in seen:continue
    seen.add(oid)
    if git('cat-file','-t',oid).strip()!=b'blob':continue
    raw=git('cat-file','blob',oid);blobs+=1
    if b'\x00' in raw:continue
    text=raw.decode('utf-8',errors='replace')
    for kind,p in patterns.items():
        for m in p.finditer(text):
            candidate=m.group(m.lastindex or 0)
            if re.search(r'example|placeholder|your_|process.env|import.meta|env\(',candidate,re.I):continue
            hits.append({'kind':kind,'blob':oid[:12],'path':name,'line':text.count('\n',0,m.start())+1})
    for key,value in secrets:
        if value in text:hits.append({'kind':'current_secret_value_match','key_name':key,'blob':oid[:12],'path':name})
work=[]
files=git('ls-files','--cached','--others','--exclude-standard','-z').decode().split('\0')
for name in files:
    if not name:continue
    p=root/name
    if not p.is_file():continue
    raw=p.read_bytes()
    if b'\x00' in raw:continue
    text=raw.decode('utf-8',errors='replace')
    for kind,pat in patterns.items():
        for m in pat.finditer(text):
            candidate=m.group(m.lastindex or 0)
            if re.search(r'example|placeholder|your_|process.env|import.meta|env\(',candidate,re.I):continue
            work.append({'kind':kind,'path':name,'line':text.count('\n',0,m.start())+1})
bundle=[]
for p in (root/'dist').rglob('*'):
    if not p.is_file() or p.suffix not in ['.js','.html','.json','.css','.map']:continue
    text=p.read_text(encoding='utf-8',errors='replace')
    for key,value in secrets:
        if value in text:bundle.append({'key_name':key,'path':str(p.relative_to(root))})
logs=[]; log_files=list((root/'backend/storage/logs').glob('*.log'))
for p in log_files:
    text=p.read_text(encoding='utf-8',errors='replace')
    for key,value in secrets:
        if value in text:logs.append({'key_name':key,'path':str(p.relative_to(root))})
result={'commits':len(git('rev-list','--all').splitlines()),'blobs_scanned':blobs,'history_findings':hits,'working_tree_findings':work,'current_secret_matches_in_dist':bundle,'log_files_scanned':len(log_files),'current_secret_matches_in_logs':logs,'environment_flags':envflags,'remote_with_embedded_credentials':bool(re.search(rb'https?://[^\s/]+:[^\s/]+@',subprocess.run(['git','config','--get-regexp','remote.*.url'],cwd=root,capture_output=True).stdout))}
(root/'.local').mkdir(exist_ok=True)
(root/'.local/security-inventory.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
