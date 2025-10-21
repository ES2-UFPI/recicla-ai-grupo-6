from http.client import HTTPResponse
from django.http import FileResponse, Http404
from django.conf import settings
from pathlib import Path

def spa(request):
    index = Path(settings.BASE_DIR.parent.parent, "frontend", "build", "index.html")
    if not index.exists():
        raise Http404("Frontend build not found. Run `npm run build` in /frontend.")
    return FileResponse(open(index, "rb"))


def index(request):
    return HTTPResponse("Hello, world. You're at the polls index.")
    