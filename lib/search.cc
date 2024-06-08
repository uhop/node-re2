#include "./wrapped_re2.h"

NAN_METHOD(WrappedRE2::Search)
{

	// unpack arguments

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2)
	{
		info.GetReturnValue().Set(-1);
		return;
	}

	auto str = re2->prepareArgument(info[0], true);
	if (str.isBad) return; // throws an exception

	if (!str.data)
		return;

	// actual work

	re2::StringPiece match;

	if (re2->regexp.Match(str, 0, str.size, re2->sticky ? re2::RE2::ANCHOR_START : re2::RE2::UNANCHORED, &match, 1))
	{
		info.GetReturnValue().Set(static_cast<int>(str.isBuffer ? match.data() - str.data : getUtf16Length(str.data, match.data())));
		return;
	}

	info.GetReturnValue().Set(-1);
}
