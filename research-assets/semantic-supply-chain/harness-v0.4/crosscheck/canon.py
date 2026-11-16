import sys, time
from pyld import jsonld
nq = open(sys.argv[1]).read()
t = time.perf_counter()
jsonld.normalize(nq, {'algorithm': 'URDNA2015', 'inputFormat': 'application/n-quads', 'format': 'application/n-quads'})
print('{"ms": %.1f, "out": "ok"}' % ((time.perf_counter() - t) * 1000))
