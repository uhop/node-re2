#include "./wrapped_re2.h"

#include <algorithm>
#include <limits>
#include <vector>

NAN_METHOD(WrappedRE2::Split)
{

	auto result = Nan::New<v8::Array>();

	// unpack arguments

	auto re2 = Nan::ObjectWrap::Unwrap<WrappedRE2>(info.This());
	if (!re2)
	{
		Nan::Set(result, 0, info[0]);
		info.GetReturnValue().Set(result);
		return;
	}

	// ECMA-262 order. The limit's conversion can run JS, so it precedes the subject's cache.
	auto subject = info[0];
	if (!isBinaryValue(subject))
	{
		auto text = subject->ToString(Nan::GetCurrentContext());
		if (text.IsEmpty()) return; // throws an exception
		subject = text.ToLocalChecked();
	}

	size_t limit = std::numeric_limits<uint32_t>::max();
	if (info.Length() > 1 && !info[1]->IsUndefined())
	{
		auto converted = info[1]->Uint32Value(Nan::GetCurrentContext());
		if (converted.IsNothing()) return; // throws an exception
		limit = converted.FromJust();
		if (!limit)
		{
			info.GetReturnValue().Set(result);
			return;
		}
	}

	PrepareLastString prep(re2, subject);
	StrVal& str = prep;
	if (str.isBad) return; // throws an exception

	// actual work

	if (!str.size)
	{
		if (!re2->findMatch(str, 0, 0, RE2::UNANCHORED, nullptr, 0))
		{
			Nan::Set(result, 0, subject);
		}
		info.GetReturnValue().Set(result);
		return;
	}

	std::vector<re2::StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1), pieces;
	const auto &match = groups[0];
	size_t pieceStart = 0, searchFrom = 0;

	// ECMAScript SplitMatcher: an unanchored search stands in for its sticky probes
	while (searchFrom < str.size && re2->findMatch(str, searchFrom, str.size, RE2::UNANCHORED, &groups[0], groups.size()))
	{
		const size_t matchStart = match.data() - str.data, matchEnd = matchStart + match.size();
		if (matchStart == str.size)
		{
			break;
		}
		searchFrom = match.size() ? matchEnd : matchStart + getUtf8CharSize(str.data[matchStart], str.size - matchStart);
		if (matchEnd == pieceStart)
		{
			continue;
		}
		pieces.push_back(re2::StringPiece(str.data + pieceStart, matchStart - pieceStart));
		pieces.insert(pieces.end(), groups.begin() + 1, groups.end());
		pieceStart = matchEnd;
		if (pieces.size() >= limit)
		{
			break;
		}
	}
	if (pieces.size() < limit)
	{
		pieces.push_back(re2::StringPiece(str.data + pieceStart, str.size - pieceStart));
	}

	// form a result

	if (str.isBuffer)
	{
		for (size_t i = 0, n = std::min(pieces.size(), limit); i < n; ++i)
		{
			const auto &item = pieces[i];
			if (item.data())
			{
				Nan::Set(result, i, Nan::CopyBuffer(item.data(), item.size()).ToLocalChecked());
			}
			else
			{
				Nan::Set(result, i, Nan::Undefined());
			}
		}
	}
	else
	{
		for (size_t i = 0, n = std::min(pieces.size(), limit); i < n; ++i)
		{
			const auto &item = pieces[i];
			if (item.data())
			{
				Nan::Set(result, i, Nan::New(item.data(), item.size()).ToLocalChecked());
			}
			else
			{
				Nan::Set(result, i, Nan::Undefined());
			}
		}
	}

	info.GetReturnValue().Set(result);
}
