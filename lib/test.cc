#include "./wrapped_re2.h"
#include "./str-val.h"

#include <vector>

NAN_METHOD(WrappedRE2::Test)
{

	// unpack arguments

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2)
	{
		info.GetReturnValue().Set(false);
		return;
	}

	re2->prepareLastString(info[0]);
	StrValBase &str = *re2->lastStringValue;
	if (str.isBad) return; // throws an exception

	if (!re2->global && !re2->sticky)
	{
		info.GetReturnValue().Set(re2->regexp.Match(str, 0, str.size, re2::RE2::UNANCHORED, NULL, 0));
		return;
	}

	if (!str.isIndexValid)
	{
		re2->lastIndex = 0;
		info.GetReturnValue().SetNull();
		return;
	}

	// actual work

	re2::StringPiece match;
	if (re2->regexp.Match(str, str.byteIndex, str.size, re2->sticky ? re2::RE2::ANCHOR_START : re2::RE2::UNANCHORED, &match, 1))
	{
		re2->lastIndex +=
			str.isBuffer ? match.data() - str.data + match.size() - str.byteIndex : getUtf16Length(str.data + str.byteIndex, match.data() + match.size());
		info.GetReturnValue().Set(true);
		return;
	}
	re2->lastIndex = 0;
	info.GetReturnValue().Set(false);
}
