"""Verify checksums and optionally rebuild solely from frozen release inputs."""
import argparse, hashlib, json, subprocess, sys
from pathlib import Path

def verify(release, rebuild=False):
    release=Path(release).resolve()
    manifest=json.loads((release/'manifest.json').read_text(encoding='utf-8'))
    failures=[]
    for name,expected in manifest['files'].items():
        p=(release/name).resolve()
        if release not in p.parents or not p.is_file(): failures.append(name+': missing or outside release'); continue
        if hashlib.sha256(p.read_bytes()).hexdigest()!=expected: failures.append(name+': hash mismatch')
    result={'release':str(release),'version':manifest['version'],'files_checked':len(manifest['files']),'checksums':'passed' if not failures else 'failed','failures':failures}
    if rebuild:
        proc=subprocess.run([sys.executable,'-B',str(release/'scripts'/'build_release.py'),'--version',manifest['version']],capture_output=True,text=True,encoding='utf-8')
        if proc.returncode: raise RuntimeError(proc.stdout+'\n'+proc.stderr)
        build=json.loads(proc.stdout); reproduced=json.loads((Path(build['output'])/'manifest.json').read_text(encoding='utf-8'))
        result['rebuild_output']=build['output']
        result['byte_identical_rebuild']=manifest==reproduced
        if not result['byte_identical_rebuild']:
            differing=sorted(k for k in set(manifest['files'])|set(reproduced['files']) if manifest['files'].get(k)!=reproduced['files'].get(k))
            failures.append('Rebuild differs: '+', '.join(differing))
    result['status']='passed' if not failures else 'failed'
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('release'); parser.add_argument('--rebuild',action='store_true'); args=parser.parse_args()
    result=verify(args.release,args.rebuild); print(json.dumps(result,indent=2)); sys.exit(0 if result['status']=='passed' else 1)
