#include "./wrapped_re2.h"
#include "./util.h"


using v8::Integer;


NAN_METHOD(WrappedRE2::Search) {

	// unpack arguments

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2) {
		info.GetReturnValue().Set(-1);
		return;
	}

	StrVal a(info[0]);

	// actual work

	StringPiece match;

	size_t lastIndex = re2->lastIndex;
	re2->lastIndex = 0;

	bool found = re2->DoExec(a, match);

	re2->lastIndex = lastIndex;

	if (found) {
		info.GetReturnValue().Set(static_cast<int>(a.isBuffer ? match.data() - a.data :
			getUtf16Length(a.data, match.data())));
		return;
	}

	info.GetReturnValue().Set(-1);
}
