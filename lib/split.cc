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

	auto str = re2->prepareArgument(info[0], true);
	if (str.isBad) return; // throws an exception

	size_t limit = std::numeric_limits<size_t>::max();
	if (info.Length() > 1 && info[1]->IsNumber())
	{
		size_t lim = info[1]->NumberValue(Nan::GetCurrentContext()).FromMaybe(0);
		if (lim > 0)
		{
			limit = lim;
		}
	}

	// actual work

	std::vector<re2::StringPiece> groups(re2->regexp.NumberOfCapturingGroups() + 1), pieces;
	const auto &match = groups[0];
	size_t byteIndex = 0;

	while (byteIndex < str.size && re2->regexp.Match(str, byteIndex, str.size, RE2::UNANCHORED, &groups[0], groups.size()))
	{
		if (match.size())
		{
			pieces.push_back(re2::StringPiece(str.data + byteIndex, match.data() - str.data - byteIndex));
			byteIndex = match.data() - str.data + match.size();
			pieces.insert(pieces.end(), groups.begin() + 1, groups.end());
		}
		else
		{
			size_t sym_size = getUtf8CharSize(str.data[byteIndex]);
			pieces.push_back(re2::StringPiece(str.data + byteIndex, sym_size));
			byteIndex += sym_size;
		}
		if (pieces.size() >= limit)
		{
			break;
		}
	}
	if (pieces.size() < limit && (byteIndex < str.size || (byteIndex == str.size && match.size())))
	{
		pieces.push_back(re2::StringPiece(str.data + byteIndex, str.size - byteIndex));
	}

	if (pieces.empty())
	{
		Nan::Set(result, 0, info[0]);
		info.GetReturnValue().Set(result);
		return;
	}

	// form a result

	if (str.isBuffer)
	{
		for (size_t i = 0, n = std::min(pieces.size(), limit); i < n; ++i)
		{
			const auto &item = pieces[i];
			Nan::Set(result, i, Nan::CopyBuffer(item.data(), item.size()).ToLocalChecked());
		}
	}
	else
	{
		for (size_t i = 0, n = std::min(pieces.size(), limit); i < n; ++i)
		{
			const auto &item = pieces[i];
			Nan::Set(result, i, Nan::New(item.data(), item.size()).ToLocalChecked());
		}
	}

	info.GetReturnValue().Set(result);
}
