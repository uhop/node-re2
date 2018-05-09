#include "./wrapped_re2.h"
#include "./util.h"

#include <vector>

#include <node_buffer.h>


using std::vector;

using v8::Local;
using v8::String;


NAN_METHOD(WrappedRE2::Test) {

	// unpack arguments

	WrappedRE2* re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2) {
		info.GetReturnValue().Set(false);
		return;
	}

	vector<char> buffer;

	StrVal str(info[0], re2->GetStartIndexHint());
	if (str.IsEmpty()) {
		return;
	}

	Utf8LastIndexGuard guard(re2, str);

	// actual work

	StringPiece match;
	bool result = re2->DoExec(str, match);
	if (!result) {
		guard.DontRestore();
	}
	info.GetReturnValue().Set(result);
}
