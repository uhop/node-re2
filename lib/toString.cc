#include "./wrapped_re2.h"


#include <string>


using std::string;


NAN_METHOD(WrappedRE2::ToString) {
	NanScope();

	// unpack arguments

	WrappedRE2* re2 = ObjectWrap::Unwrap<WrappedRE2>(args.This());
	if (!re2) {
		NanReturnValue(NanNew(""));
	}

	// actual work

	string buf("/");
	buf += re2->regexp.pattern();
	buf += "/";

	if (re2->ignoreCase) {
		buf += "i";
	}
	if (re2->global) {
		buf += "g";
	}
	if (re2->multiline) {
		buf += "m";
	}

	NanReturnValue(NanNew(buf));
}
