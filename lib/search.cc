#include "./wrapped_re2.h"
#include "./util.h"

NAN_METHOD(WrappedRE2::Search)
{

	// unpack arguments

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2)
	{
		info.GetReturnValue().Set(-1);
		return;
	}

	StrVal a = info[0];
	if (!a.data)
	{
		return;
	}

	// actual work

	re2::StringPiece match;

	if (re2->regexp.Match(a, 0, a.size, re2->sticky ? re2::RE2::ANCHOR_START : re2::RE2::UNANCHORED, &match, 1))
	{
		info.GetReturnValue().Set(static_cast<int>(a.isBuffer ? match.data() - a.data : getUtf16Length(a.data, match.data())));
		return;
	}

	info.GetReturnValue().Set(-1);
}
