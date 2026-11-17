from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
loader='<link rel="stylesheet" href="activity-wbs.css?v=261117"><script src="activity-wbs.js?v=261117"></script>'
title='<title>Modul Transformasi Kemenkeu</title>'
assert s.count(title)==1,'Expected module title at top'
assert s.count(loader)==1,'Expected one misplaced loader to relocate'
# The first closing </head> belongs to a Word-export template, not to the outer application.
s=s.replace(loader+'\n','',1)
s=s.replace(title,title+'\n'+loader,1)
assert s.count(loader)==1 and s.index(loader)<s.index('<style>'),'WBS loader must load on the outer page'
p.write_text(s,encoding='utf-8')
print('Repositioned PM/CM WBS scripts in Modul Transformasi top-level HTML')
