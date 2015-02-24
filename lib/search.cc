#include "./wrapped_re2.h"
#include "./util.h"


using v8::Integer;


NAN_METHOD(WrappedRE2::Search) {
	NanScope();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		NanReturnValue(NanNew(-1));
	}

	StrVal a(args[0]);

	// actual work

	StringPiece match;

	if (re2->regexp.Match(a, 0, a.size, RE2::UNANCHORED, &match, 1)) {
		NanReturnValue(NanNew<Integer>(static_cast<int>(a.isBuffer ? match.data() - a.data :
			getUtf16Length(a.data, match.data()))));
	}

	NanReturnValue(NanNew(-1));
}
